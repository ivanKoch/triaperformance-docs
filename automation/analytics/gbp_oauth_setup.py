#!/usr/bin/env python3
"""
One-time: obtain a Google Business Profile refresh token for coach@triaperformance.com.

RUN THIS ON IVÁN'S LAPTOP, NOT ON THE VPS. It opens a browser for the consent
screen, and the VPS has none.

    pip3 install --user google-auth-oauthlib
    python3 gbp_oauth_setup.py ~/Downloads/client_secret_XXXX.json

It writes three values to ~/.gbp-credentials (mode 0600) and prints only that
path. Nothing is echoed to the terminal, by design: the first version printed
them, and they were in a chat transcript within a minute and had to be revoked.


WHY OAUTH AND NOT A SERVICE ACCOUNT
Every other Google integration on this box uses the `pixel-sync-vps` service
account. This one cannot: Google's Business Profile API supports OAuth 2.0
only, and service accounts are not a supported credential type (verified
against Google's own setup doc, Aug 30 2026, after the opposite was assumed
and written down).


THE ONE SETTING THAT WILL BREAK THIS LATER
The OAuth consent screen must be **Internal**, not **Testing**.

A client left in Testing issues refresh tokens that EXPIRE AFTER 7 DAYS. The
cron would run green for a week and then start failing — and it would fail at
05:xx, unattended, with the failure visible only in a log nobody opens. That is
this box's signature failure mode (§14: a Monday check-in silently drift-blocked
by an unpinned model; §18: a dispatcher that broke on its first real run).

`Internal` is available because triaperformance.com is a Workspace domain. It
needs no Google verification review and carries no 7-day clock.

If this ever stops working roughly a week after being set up, the consent
screen is in Testing. That is the first thing to check, not the last.
"""

import json
import os
import sys

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    sys.exit("Missing dependency. Run:  pip3 install --user google-auth-oauthlib")

# One scope covers the whole Business Profile API family — account management,
# business information, performance, and the legacy v4 endpoints that serve
# reviews. There is no narrower read-only variant published for these APIs.
SCOPES = ["https://www.googleapis.com/auth/business.manage"]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__.strip().splitlines()[4].strip())

    client_file = sys.argv[1]
    with open(client_file, encoding="utf-8") as fh:
        installed = json.load(fh).get("installed") or {}
    if not installed:
        sys.exit(
            "That JSON has no `installed` block, so it is not a Desktop-app client.\n"
            "Create the OAuth client with application type 'Desktop app' and download it again."
        )

    flow = InstalledAppFlow.from_client_secrets_file(client_file, SCOPES)
    # access_type=offline is what makes Google issue a refresh token at all;
    # prompt=consent forces a NEW one even if this account has authorised before
    # (Google reuses the existing grant otherwise and returns no refresh token,
    # which looks like a bug in this script and is not).
    creds = flow.run_local_server(
        port=0, access_type="offline", prompt="consent",
        authorization_prompt_message="Sign in as coach@triaperformance.com — a browser will open.",
    )

    if not creds.refresh_token:
        sys.exit(
            "No refresh token returned. This happens when the account has already granted\n"
            "this client and Google reused the grant. Revoke it at\n"
            "https://myaccount.google.com/permissions and run this again."
        )

    # NEVER print these to stdout. The first version of this script did, on the
    # reasoning that a printed warning ("do not paste this into chat") would be
    # enough. It was not: the values went into a chat transcript within a minute
    # of being generated, and had to be revoked and reissued.
    #
    # A warning is not a control. The secret now goes to a 0600 file and the
    # terminal sees only a path — which also means a scrollback buffer, a
    # screen-share, or a pasted "here is what it said" cannot leak it.
    out = os.path.join(os.path.expanduser("~"), ".gbp-credentials")
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(f"GBP_CLIENT_ID={installed['client_id']}\n")
        fh.write(f"GBP_CLIENT_SECRET={installed['client_secret']}\n")
        fh.write(f"GBP_REFRESH_TOKEN={creds.refresh_token}\n")

    print("\n" + "=" * 72)
    print(f"Written to {out}  (permissions 0600, nothing echoed to this terminal)")
    print("=" * 72)
    print("Copy it to the clipboard WITHOUT displaying it:")
    print(f"    pbcopy < {out}")
    print("Paste those three lines into ~/.analytics/.env on the VPS, then:")
    print(f"    rm {out}")
    print("    rm ~/Downloads/client_secret_*.json")
    print("\nDo not `cat` this file. Displaying it puts it in scrollback, which is")
    print("how the previous set of credentials ended up needing to be revoked.")


if __name__ == "__main__":
    main()
