from app.database import supabase

tickets = [
    {"title": "Can't access my account — locked out", "description": "I've tried resetting my password three times and still get an error saying 'invalid credentials'. This started after your maintenance window last night. I need access urgently for a client demo tomorrow.", "submitter_email": "sarah@acmecorp.com", "status": "open"},
    {"title": "Charged twice for October", "description": "My card was billed $49.99 twice on Oct 3rd. Order #88123 and #88124. Please refund the duplicate charge immediately.", "submitter_email": "billing@widgets.io", "status": "open"},
    {"title": "Dashboard not loading — white screen", "description": "After today's update the dashboard shows a white screen in Chrome and Firefox. Console: TypeError: Cannot read properties of undefined (reading 'map'). Affects our entire team of 12.", "submitter_email": "dev@startupxyz.com", "status": "open"},
    {"title": "How do I export data to CSV?", "description": "I've looked through the docs but can't find how to export analytics to CSV. Is this available on the starter plan?", "submitter_email": "user@example.com", "status": "open"},
    {"title": "Need to upgrade plan — urgent", "description": "We need to upgrade from Starter to Business immediately. We're launching tomorrow and need the higher API limits.", "submitter_email": "cto@biglaunch.io", "status": "open"},
    {"title": "API rate limit too restrictive", "description": "We're hitting the 100 req/min limit constantly in production. We need at least 500 req/min before we switch to a competitor.", "submitter_email": "eng@fastapp.com", "status": "open"},
    {"title": "Possible data breach — need response NOW", "description": "Unauthorized logins from IP 185.220.101.45 accessed our account at 3am EST and exported data. This is a CRITICAL security issue. Please respond immediately.", "submitter_email": "security@enterprise.com", "status": "open"},
    {"title": "Invoice doesn't match quote", "description": "Invoice #INV-2024-0892 shows $299/month but our signed quote was $249/month for the annual plan. Please correct and resend.", "submitter_email": "finance@company.com", "status": "open"},
    {"title": "Feature request: dark mode", "description": "Would love a dark mode option. Many of our team work late and the bright white interface is straining. Happy to provide design feedback.", "submitter_email": "ux@designstudio.com", "status": "open"},
    {"title": "Salesforce integration broken", "description": "The Salesforce sync stopped working after v2.3. Contacts aren't syncing and we're getting 401 errors in the integration logs. Blocking our entire sales team.", "submitter_email": "ops@salesteam.com", "status": "open"},
    {"title": "Account suspended wrongly", "description": "My account was suspended today with no explanation. I've been a paying customer for 2 years and haven't violated any terms. I have client work due today.", "submitter_email": "freelancer@work.com", "status": "open"},
    {"title": "Mobile app crashes on iOS 17", "description": "App crashes immediately on launch after updating to iOS 17.2. Tried reinstalling three times. iPhone 15 Pro. Completely unusable on mobile.", "submitter_email": "mobile@user.com", "status": "open"},
    {"title": "Wrong email address on account", "description": "Need to change email from old@email.com to new@email.com. Self-service keeps saying 'email already in use' even though I don't have another account.", "submitter_email": "old@email.com", "status": "open"},
    {"title": "Bulk user import via CSV needed", "description": "We need to onboard 200 new employees and doing it one-by-one isn't feasible. A CSV import would save us hours. Is this on the roadmap?", "submitter_email": "hr@bigcompany.com", "status": "open"},
    {"title": "Reports taking 10+ minutes to generate", "description": "Monthly analytics used to take 30 seconds. Past week it's been 10-15 minutes. Nothing changed on our end. Affects reports over 10k rows.", "submitter_email": "analyst@dataco.com", "status": "open"},
    {"title": "SSO setup not working", "description": "Getting SAML assertion errors authenticating through Okta. Error: 'Invalid signature'. Our IT team verified the certificate matches your docs.", "submitter_email": "it@enterprise.com", "status": "open"},
    {"title": "Trial expired early — only got 15 days", "description": "Signed up Nov 1st and trial expired Nov 15th. Your site says 30-day trial. Please extend to the correct date.", "submitter_email": "new@customer.com", "status": "open"},
    {"title": "Webhook not firing for payment events", "description": "Our endpoint isn't receiving payment.completed events. Configured correctly, other event types work fine. Started after your Nov 10th deployment.", "submitter_email": "backend@shopapp.com", "status": "open"},
    {"title": "GDPR data export needed within 72 hours", "description": "Legal team needs a full export of all user data stored through your platform for a GDPR compliance audit. Required by regulation within 72 hours.", "submitter_email": "legal@eucompany.eu", "status": "open"},
    {"title": "Team member can't see shared dashboards", "description": "New team member added last week can't see shared dashboards despite having Editor role. All other editors can see everything. Just this one user.", "submitter_email": "admin@team.com", "status": "open"},
]

def seed():
    supabase.table("tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    result = supabase.table("tickets").insert(tickets).execute()
    print(f"✓ Seeded {len(result.data)} tickets")

if __name__ == "__main__":
    seed()