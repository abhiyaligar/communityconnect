"""
CommunityConnect Backend - HTML Email Templates
"""

def activation_success_email(full_name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 40px 0 40px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto">
<tr><td style="width:48px;height:48px;border-radius:12px;border:1px solid #e2e8f0;background-color:#f8fafc;text-align:center;vertical-align:middle">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2">
<circle cx="12" cy="12" r="3.5" fill="#0f172a" fill-opacity="0.1"/>
<circle cx="12" cy="4.5" r="2"/>
<circle cx="5" cy="9.5" r="2"/>
<circle cx="19" cy="9.5" r="2"/>
<circle cx="8" cy="18.5" r="2"/>
<circle cx="16" cy="18.5" r="2"/>
<path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2"/>
</svg>
</td></tr></table>
<p style="font-size:22px;font-weight:800;color:#0f172a;margin:16px 0 4px 0;letter-spacing:-0.3px">Lad Matrimony</p>
</td></tr>
<tr><td style="padding:32px 40px;text-align:center">
<div style="width:56px;height:56px;border-radius:50%;background-color:#d1fae5;margin:0 auto 20px auto;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10003;</span>
</div>
<h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px 0;letter-spacing:-0.3px">Account Activated!</h1>
<p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 24px 0">Hi <strong style="color:#0f172a">{full_name}</strong>, your Lad Matrimony account has been successfully activated. You&#39;re now part of a trusted community connecting families and finding meaningful matches.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;padding:20px;width:100%">
<tr><td style="text-align:left">
<p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 12px 0">&#10003; What&#39;s next?</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 8px 0">&#9702; Complete your profile with photos and preferences</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 8px 0">&#9702; Submit for admin verification to unlock all features</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 0 0">&#9702; Start browsing verified profiles in your community</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 40px 32px 40px;text-align:center">
<a href="{{login_url}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:12px;text-decoration:none">Go to Dashboard</a>
</td></tr>
<tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
<p style="font-size:11px;color:#94a3b8;margin:0 0 4px 0">Lad Matrimony &mdash; Your Community, Your Match</p>
<p style="font-size:10px;color:#94a3b8;margin:0">If you didn&#39;t create this account, please ignore this email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def verification_approved_email(full_name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 40px 0 40px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto">
<tr><td style="width:48px;height:48px;border-radius:12px;border:1px solid #e2e8f0;background-color:#f8fafc;text-align:center;vertical-align:middle">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2">
<circle cx="12" cy="12" r="3.5" fill="#0f172a" fill-opacity="0.1"/>
<circle cx="12" cy="4.5" r="2"/>
<circle cx="5" cy="9.5" r="2"/>
<circle cx="19" cy="9.5" r="2"/>
<circle cx="8" cy="18.5" r="2"/>
<circle cx="16" cy="18.5" r="2"/>
<path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2"/>
</svg>
</td></tr></table>
<p style="font-size:22px;font-weight:800;color:#0f172a;margin:16px 0 4px 0;letter-spacing:-0.3px">Lad Matrimony</p>
</td></tr>
<tr><td style="padding:32px 40px;text-align:center">
<div style="width:56px;height:56px;border-radius:50%;background-color:#d1fae5;margin:0 auto 20px auto;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px">&#10003;</span>
</div>
<h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px 0;letter-spacing:-0.3px">Identity Verified!</h1>
<p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 24px 0">Hi <strong style="color:#0f172a">{full_name}</strong>, your profile has been verified by a community admin. You now have full access to all Lad Matrimony features.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;padding:20px;width:100%">
<tr><td style="text-align:left">
<p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 12px 0">&#10003; What you can do now</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 8px 0">&#9702; Browse &amp; connect with verified profiles</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 8px 0">&#9702; Send and receive matrimony requests</p>
<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 0 0">&#9702; Chat securely with your matches</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 40px 32px 40px;text-align:center">
<a href="{{dashboard_url}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:12px;text-decoration:none">Start Matching</a>
</td></tr>
<tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
<p style="font-size:11px;color:#94a3b8;margin:0 0 4px 0">Lad Matrimony &mdash; Your Community, Your Match</p>
<p style="font-size:10px;color:#94a3b8;margin:0">If you have questions, contact your community admin.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def verification_rejected_email(full_name: str, reason: str | None = None) -> str:
    reason_html = f"<p style=\"font-size:13px;color:#64748b;line-height:1.5;margin:12px 0 0 0;padding:12px;background-color:#fef2f2;border-radius:8px;border:1px solid #fecaca\"><strong>Reason:</strong> {reason}</p>" if reason else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 40px 0 40px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto">
<tr><td style="width:48px;height:48px;border-radius:12px;border:1px solid #e2e8f0;background-color:#f8fafc;text-align:center;vertical-align:middle">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2">
<circle cx="12" cy="12" r="3.5" fill="#0f172a" fill-opacity="0.1"/>
<circle cx="12" cy="4.5" r="2"/>
<circle cx="5" cy="9.5" r="2"/>
<circle cx="19" cy="9.5" r="2"/>
<circle cx="8" cy="18.5" r="2"/>
<circle cx="16" cy="18.5" r="2"/>
<path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2"/>
</svg>
</td></tr></table>
<p style="font-size:22px;font-weight:800;color:#0f172a;margin:16px 0 4px 0;letter-spacing:-0.3px">Lad Matrimony</p>
</td></tr>
<tr><td style="padding:32px 40px;text-align:center">
<div style="width:56px;height:56px;border-radius:50%;background-color:#fef2f2;margin:0 auto 20px auto;display:flex;align-items:center;justify-content:center">
<span style="font-size:28px;color:#ef4444">&#10007;</span>
</div>
<h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px 0;letter-spacing:-0.3px">Verification Not Approved</h1>
<p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 24px 0">Hi <strong style="color:#0f172a">{full_name}</strong>, your profile verification could not be approved at this time.</p>
{reason_html}
</td></tr>
<tr><td style="padding:0 40px 32px 40px;text-align:center">
<a href="{{support_url}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:12px;text-decoration:none">Contact Support</a>
</td></tr>
<tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
<p style="font-size:11px;color:#94a3b8;margin:0 0 4px 0">Lad Matrimony &mdash; Your Community, Your Match</p>
<p style="font-size:10px;color:#94a3b8;margin:0">You may update your profile and re-submit for verification.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""
