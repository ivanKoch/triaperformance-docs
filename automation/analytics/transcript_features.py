#!/usr/bin/env python3
"""Per-athlete engagement features from WhatsApp transcripts.

Reads a folder OUTSIDE the repo holding iOS WhatsApp exports
(`WhatsApp Chat - <name>.txt`) and a `join.csv` (athlete_id, source,
signup, churn, file, coverage). `file` may hold several exports joined by `|`
(number changes); `coverage` is full / email (feedback ran over email, the
WhatsApp record is not the contact record) / none. Writes `data/athlete_engagement.csv` keyed by the
name-derived athlete_id only. No message text, name or email is written.

Usage: python3 transcript_features.py <chats_dir> <out_csv> [export_date]
"""
import sys, os, re, csv, datetime as dt, statistics as st, collections

COACH = 'Triaperformance'
LINE = re.compile(r'^‎?\[(\d{1,2})/(\d{1,2})/(\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ?([AP]M)\] ([^:]+): (.*)$')
CHURN_WORDS = re.compile(r'\b(cancel\w*|pausa\w*|pausar|parar|suspend\w*|terminar|dejar|dar de baja|baja|stop|pause|break|quit|end(ing)? (the|my)|no (voy a )?continuar|no puedo seguir|último mes|last month|gracias por todo|thank you for everything|renov\w*|cerrar|finalizar)\b', re.I)
SYSTEM = re.compile(r'(end-to-end encrypted|cifrados de extremo|Messages and calls|Los mensajes y las llamadas)')

def parse(path):
    msgs = []
    for line in open(path, encoding='utf-8', errors='ignore'):
        m = LINE.match(line.rstrip('\n'))
        if not m:
            continue
        d, mo, y, h, mi, s, ap, sender, text = m.groups()
        h = int(h) % 12 + (12 if ap == 'PM' else 0)
        ts = dt.datetime(int(y), int(mo), int(d), h, int(mi), int(s))
        sender = sender.strip('‎ ')
        if SYSTEM.search(text):
            continue
        msgs.append((ts, sender == COACH, text))
    return msgs

def week(d):
    return (d - dt.timedelta(days=d.weekday())).date()

def features(msgs, signup, end, churned):
    r = {}
    if not msgs:
        return r
    coach = [m for m in msgs if m[1]]
    ath = [m for m in msgs if not m[1]]
    r['first_msg'] = msgs[0][0].date().isoformat()
    r['last_msg'] = msgs[-1][0].date().isoformat()
    r['presale_days'] = (signup - msgs[0][0].date()).days
    r['coach_msgs'] = len(coach); r['athlete_msgs'] = len(ath)
    r['athlete_share'] = round(len(ath) / len(msgs), 3)
    # weekly grid over the paid period
    w0, w1 = week(dt.datetime.combine(signup, dt.time())), week(dt.datetime.combine(end, dt.time()))
    weeks = []
    w = w0
    while w <= w1:
        weeks.append(w); w += dt.timedelta(days=7)
    cw = collections.Counter(week(m[0]) for m in coach)
    aw = collections.Counter(week(m[0]) for m in ath)
    r['weeks_paid'] = len(weeks)
    r['weeks_coach_wrote'] = sum(1 for w in weeks if cw[w])
    r['weeks_athlete_wrote'] = sum(1 for w in weeks if aw[w])
    r['weeks_coach_no_reply'] = sum(1 for w in weeks if cw[w] and not aw[w])
    r['weeks_coach_silent'] = sum(1 for w in weeks if not cw[w])
    r['athlete_reply_week_rate'] = round(r['weeks_athlete_wrote'] / r['weeks_coach_wrote'], 3) if r['weeks_coach_wrote'] else ''
    r['athlete_msgs_per_week'] = round(len([m for m in ath if signup <= m[0].date() <= end]) / max(len(weeks), 1), 2)
    # silent streaks (weeks coach wrote, athlete did not)
    streak = best = 0
    for w in weeks:
        if cw[w] and not aw[w]:
            streak += 1; best = max(best, streak)
        elif aw[w]:
            streak = 0
    r['max_silent_streak_weeks'] = best
    # trailing silence: weeks at the end (up to `end`) with no athlete message
    tail = 0
    for w in reversed(weeks):
        if aw[w]:
            break
        tail += 1
    r['trailing_silent_weeks'] = tail
    last_ath = max((m[0].date() for m in ath if m[0].date() <= end), default=None)
    r['days_end_to_last_athlete_msg'] = (end - last_ath).days if last_ath else ''
    # reply latency: for each coach message where the previous message was not coach-followed-by-athlete yet
    lat = []
    i = 0
    while i < len(msgs):
        if msgs[i][1]:
            j = i + 1
            while j < len(msgs) and msgs[j][1]:
                j += 1
            if j < len(msgs):
                lat.append((msgs[j][0] - msgs[j-1][0]).total_seconds() / 3600)
            i = j
        else:
            i += 1
    r['median_reply_hours'] = round(st.median(lat), 1) if lat else ''
    r['p75_reply_hours'] = round(sorted(lat)[int(len(lat)*0.75)], 1) if lat else ''
    # early vs late athlete activity (first 4 paid weeks vs last 4 paid weeks)
    if len(weeks) >= 8:
        r['athlete_msgs_first4w'] = sum(aw[w] for w in weeks[:4])
        r['athlete_msgs_last4w'] = sum(aw[w] for w in weeks[-4:])
    else:
        r['athlete_msgs_first4w'] = r['athlete_msgs_last4w'] = ''
    # athlete-initiated threads: athlete message after >12h of silence
    init = sum(1 for k in range(1, len(msgs)) if not msgs[k][1] and (msgs[k][0] - msgs[k-1][0]).total_seconds() > 12*3600)
    r['athlete_initiated_threads'] = init
    # churn announcement: athlete message in the 45 days before churn matching churn vocabulary
    if churned:
        win = [m for m in ath if 0 <= (end - m[0].date()).days <= 45]
        r['churn_announced'] = int(any(CHURN_WORDS.search(m[2]) for m in win))
        r['athlete_msgs_last45d'] = len(win)
        r['msgs_after_churn'] = sum(1 for m in msgs if m[0].date() > end + dt.timedelta(days=7))
        r['athlete_msgs_after_churn'] = sum(1 for m in ath if m[0].date() > end + dt.timedelta(days=7))
    else:
        r['churn_announced'] = r['athlete_msgs_last45d'] = r['msgs_after_churn'] = r['athlete_msgs_after_churn'] = ''
    return r

def main():
    chats, out = sys.argv[1], sys.argv[2]
    export = dt.date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else dt.date.today()
    rows = []
    for j in csv.DictReader(open(os.path.join(chats, 'join.csv'))):
        if not j['file']:
            continue
        signup = dt.date.fromisoformat(j['signup'])
        churned = bool(j['churn'])
        end = dt.date.fromisoformat(j['churn']) if churned else export
        msgs = sorted((m for fn in j['file'].split('|') for m in parse(os.path.join(chats, fn))), key=lambda m: m[0])
        f = features(msgs, signup, end, churned)
        rows.append({'athlete_id': j['athlete_id'], 'source': j['source'], 'signup_date': j['signup'],
                     'churn_date': j['churn'], 'status': 'churned' if churned else 'active', 'transcript_coverage': j.get('coverage', 'full'),
                     'tenure_days': (end - signup).days, **f})
    keys = list(rows[0].keys())
    with open(out, 'w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=keys); w.writeheader(); w.writerows(rows)
    print(len(rows), 'rows ->', out)

if __name__ == '__main__':
    main()
