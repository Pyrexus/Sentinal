import type { PrivacyQuestion, ProtectionCheck } from './types';

const frequencyOptions = [
  { label: 'Rarely or never', risk: 0 },
  { label: 'Sometimes / I am unsure', risk: 1 },
  { label: 'Often', risk: 2 },
];

export const privacyQuestions: PrivacyQuestion[] = [
  { id: 'public-profile', question: 'Is your personal profile visible to people you do not know?', category: 'Social exposure', options: [{ label: 'No, I review who can see it', risk: 0 }, { label: 'Some details / I am unsure', risk: 1 }, { label: 'Yes, most details are public', risk: 2 }], action: 'Review your profile audience and hide personal contact details from public view.' },
  { id: 'live-location', question: 'Do you share your live location or daily routine publicly?', category: 'Location privacy', options: frequencyOptions, action: 'Share travel updates after you leave, and limit live location to people you trust.' },
  { id: 'password-reuse', question: 'Do you use the same password on multiple accounts?', category: 'Account security', options: frequencyOptions, action: 'Create unique passwords, starting with email and banking. A password manager can help.' },
  { id: 'identity-documents', question: 'Have you sent full identity documents through unverified chats or forms?', category: 'Identity exposure', options: [{ label: 'No', risk: 0 }, { label: 'I am unsure about an old request', risk: 1 }, { label: 'Yes, without verifying the recipient', risk: 2 }], action: 'Verify the recipient and purpose before sharing documents; provide only necessary information.' },
  { id: 'permissions', question: 'Do apps have access to contacts, photos or location they do not need?', category: 'App permissions', options: [{ label: 'No, I review permissions', risk: 0 }, { label: 'I have not checked recently', risk: 1 }, { label: 'Yes, I usually allow every request', risk: 2 }], action: 'Review app permissions and remove access that is not needed for a feature you use.' },
  { id: 'screen-lock', question: 'Is your phone left without a screen lock?', category: 'Device safety', options: [{ label: 'No, it locks automatically', risk: 0 }, { label: 'It locks after a long delay', risk: 1 }, { label: 'Yes, there is no lock', risk: 2 }], action: 'Set a strong device screen lock and a short automatic locking delay.' },
  { id: 'public-wifi', question: 'Do you use unfamiliar public Wi-Fi for sensitive accounts?', category: 'Network privacy', options: frequencyOptions, action: 'Verify the network with staff, and prefer mobile data for sensitive tasks when unsure.' },
  { id: 'connected-apps', question: 'Do unused apps or services remain connected to your accounts?', category: 'Account access', options: [{ label: 'No, I remove unused access', risk: 0 }, { label: 'I have not reviewed access', risk: 1 }, { label: 'Yes, many are still connected', risk: 2 }], action: 'Open account security settings and remove third-party access you no longer need.' },
  { id: 'recovery', question: 'Could someone else control your recovery email or phone number?', category: 'Account recovery', options: [{ label: 'No, I control and secure both', risk: 0 }, { label: 'I need to check old details', risk: 1 }, { label: 'Yes, or I no longer have access', risk: 2 }], action: 'Update recovery details through official settings and secure the recovery account too.' },
  { id: 'updates', question: 'Do you put off important phone, browser or app updates?', category: 'Device safety', options: frequencyOptions, action: 'Enable automatic updates and install pending security updates through device settings.' },
  { id: 'oversharing', question: 'Do you post tickets, document numbers or other people’s personal details?', category: 'Social exposure', options: frequencyOptions, action: 'Remove unnecessary identifiers and ask consent before sharing another person’s details.' },
  { id: 'mfa', question: 'Can your main email account be opened with only a password?', category: 'Account security', options: [{ label: 'No, I use MFA or a passkey', risk: 0 }, { label: 'I am unsure', risk: 1 }, { label: 'Yes, only a password', risk: 2 }], action: 'Enable a passkey or multi-factor authentication on your main email account.' },
];

export const protectionChecks: ProtectionCheck[] = [
  { id: 'two-step', title: 'Turn on 2-Step Verification', description: 'Add a second check to your Google sign-in. Review the method and keep recovery options available.', url: 'https://myaccount.google.com/signinoptions/two-step-verification', weight: 25 },
  { id: 'passkey', title: 'Create a passkey', description: 'Use a passkey on a device you control. Do not create one on a shared or public computer.', url: 'https://myaccount.google.com/signinoptions/passkeys', weight: 15 },
  { id: 'recovery', title: 'Check recovery options', description: 'Confirm that you still control your recovery email and phone. Keep backup codes private.', url: 'https://myaccount.google.com/security', weight: 20 },
  { id: 'sessions', title: 'Review signed-in devices', description: 'Check recent activity and sign out devices you do not recognise or no longer use.', url: 'https://myaccount.google.com/device-activity', weight: 15 },
  { id: 'third-party', title: 'Remove unused app access', description: 'Review connected apps and remove services that no longer need access to your Google account.', url: 'https://myaccount.google.com/connections', weight: 15 },
  { id: 'passwords', title: 'Review saved-password security', description: 'Check for exposed or reused passwords and replace them with unique passwords.', url: 'https://passwords.google.com/checkup/start', weight: 10 },
];
