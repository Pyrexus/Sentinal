import type { Lesson, QuizQuestion } from './types';

const question = (text: string, options: string[], answerIndex: number, explanation: string): QuizQuestion => ({ question: text, options, answerIndex, explanation });
const lesson = (slug: string, title: string, category: string, summary: string, content: string[], practice: QuizQuestion, quiz: QuizQuestion[], checklist: string[]): Lesson => ({ slug, title, category, summary, minutes: 4, content, tryIt: { prompt: practice.question, options: practice.options, answerIndex: practice.answerIndex, explanation: practice.explanation }, quiz, checklist });

export const lessons: Lesson[] = [
  lesson('phishing', 'Pause before you open that link', 'Spot the signs', 'Learn to separate a convincing message from a trustworthy request.', [
    'Phishing messages try to make you reveal information, install something or pay. They often borrow the look of a service you know. Good spelling, a familiar logo and a padlock are not proof of identity.',
    'Look at the request, not just the sender: are you being rushed, asked for a secret, or moved away from your usual app? One clue is a reason to pause, not automatic proof that every message is a scam.',
    'Verify by opening the official app or a bookmark you already trust. If you need to contact support, find the contact independently rather than using the one in the message.',
  ], question('A fictional bank says “verify in 10 minutes” and supplies a new link. What is the safest first step?', ['Open the official bank app yourself', 'Use the link because it has a padlock', 'Reply with your customer number'], 0, 'An independently opened app breaks the message’s control over where you go.'), [
    question('What does HTTPS tell you?', ['The company is genuine', 'The connection is encrypted', 'The message is accurate'], 1, 'HTTPS protects a connection; a deceptive site can also use it.'),
    question('A message has no spelling mistakes. What can you conclude?', ['It is safe', 'It came from a bank', 'Spelling alone does not establish trust'], 2, 'Well-written messages can still ask for unsafe actions.'),
    question('Where should you find a support number?', ['In the suspicious message', 'On an independently opened official site or your card', 'In the first comment under the message'], 1, 'Use a channel that is independent of the message you are checking.'),
  ], ['Bookmark important account websites.', 'Pause when a message combines urgency with a link or secret request.']),
  lesson('otp-scams', 'Keep one-time codes to yourself', 'Payments & identity', 'An OTP can approve an action even when the caller sounds helpful.', [
    'An OTP is a short-lived secret used to verify a login, payment or other action. Read the full notification to see what it authorises. Someone who asks you to dictate it may be trying to complete that action.',
    'A caller may say the code cancels fraud, updates KYC or confirms a refund. Do not follow a caller’s explanation instead of the message on your own device. Bank staff do not need your OTP, UPI PIN or CVV.',
    'If you shared a code, stop the conversation. Contact the relevant service through its official app, review recent activity and secure the account. If money moved, tell your bank promptly.',
  ], question('An agent asks for an OTP to “cancel a charge”. You should…', ['Read it out slowly', 'Send half the code', 'End the call and contact the bank independently'], 2, 'The code may approve a charge or login. Verify with your bank through a known route.'), [
    question('Who may ask you to forward a login OTP?', ['Nobody should receive it from you', 'A caller who knows your name', 'A caller with a bank logo'], 0, 'Knowing personal details or displaying branding does not make a secret request safe.'),
    question('What should you read before entering a code?', ['Only the six digits', 'The full message describing the action', 'The caller’s suggested wording'], 1, 'The notification can reveal what you are about to approve.'),
    question('You already shared an OTP. What now?', ['Wait for another call', 'Pay a recovery agent', 'Contact the service independently and review activity'], 2, 'Prompt action can limit harm, though recovery is never guaranteed.'),
  ], ['Turn on transaction and login alerts.', 'Never share OTP, PIN, CVV or backup codes.']),
  lesson('digital-arrest', 'Handle threats without acting in panic', 'Spot the signs', 'Recognise isolation, authority claims and money demands on calls.', [
    'A threatening caller may claim there is a parcel, identity or criminal case in your name. They may show a uniform or document on video. These things can be staged and do not verify authority.',
    'A demand to stay on a call, keep the matter secret, or transfer savings to prove innocence is a serious warning sign. A “digital arrest” claim over a call is not a reason to hand over money or control of your device.',
    'End the conversation and tell a trusted person. Verify any genuine concern through independently found official channels. Preserve messages and payment references if you need to report what happened.',
  ], question('A caller says “do not tell your family; transfer money for verification”. Choose the safest response.', ['Stay on video and negotiate', 'End the call and seek trusted help', 'Transfer a small amount first'], 1, 'Isolation and transfer demands are warning signs. Independent help creates room to verify.'), [
    question('Does a uniform on video verify a caller?', ['Yes', 'Only if the call is long', 'No, appearances can be staged'], 2, 'Verify identity through an official channel you find independently.'),
    question('Why might a caller demand secrecy?', ['To prevent independent checks', 'To protect your battery', 'To lower banking fees'], 0, 'Isolation removes people who could help you question the demand.'),
    question('If you sent money, what is a practical next step?', ['Delete all records', 'Contact your bank promptly and preserve records', 'Pay another caller to close the case'], 1, 'Your bank and official reporting channels can advise on immediate steps.'),
  ], ['Choose a trusted person you can contact under pressure.', 'Keep payment references when reporting a suspicious transfer.']),
  lesson('qr-scams', 'A QR code is a destination, not a guarantee', 'Payments & identity', 'Check what a QR opens and who receives a payment.', [
    'A QR code can contain a URL, payment details or plain text. Its square pattern tells you nothing about whether the destination or recipient is trustworthy.',
    'A sticker can cover an original payment code. Before approving a payment, read the recipient name and amount in your own payment app. Ask staff if anything differs from what you expect.',
    'Scanning does not by itself mean money is received. Do not enter a PIN just because someone says it will release a refund. For web links, inspect the destination and avoid entering account secrets.',
  ], question('A QR sticker covers the original parking code. What do you do?', ['Pay the smallest amount first', 'Assume every QR at the venue is official', 'Verify the recipient with staff before paying'], 2, 'A replaced code may route money to someone else.'), [
    question('What should you check before approving a QR payment?', ['Only the QR colour', 'Recipient and amount', 'Whether the sender is friendly'], 1, 'Your payment app shows who receives money and how much.'),
    question('What can a QR code contain?', ['Only payment details', 'Only safe website links', 'A link, payment details or other text'], 2, 'Treat the decoded content as untrusted until checked.'),
    question('A stranger says scanning their QR will refund you if you enter your PIN. What is safer?', ['Decline and check your transaction history', 'Enter the PIN twice', 'Share a screenshot of your PIN'], 0, 'A PIN may authorise a debit. It is not needed simply to receive funds.'),
  ], ['Read the payment confirmation screen before approving.', 'Check for tampered or replaced QR stickers.']),
  lesson('fake-jobs', 'Check the job before paying a fee', 'Student life', 'Spot task schemes, joining deposits and recruitment pressure.', [
    'Easy-income offers often arrive through messages without an application or interview. The first few tasks may even pay, building confidence before a much larger deposit is requested.',
    'Treat fees to unlock tasks, release wages or repair a negative balance as warning signs. A dashboard balance is a claim by the platform, not proof that money can be withdrawn.',
    'Check the employer, role and written terms independently. Ask your campus placement team or someone you trust. Do not hand over identity documents just to find out what the job is.',
  ], question('You earned a small task reward. Now the recruiter wants a deposit to withdraw more. What follows?', ['The first payment proves the job is genuine', 'Stop and verify; the deposit is a warning sign', 'Borrow money to unlock the balance'], 1, 'Small payouts can be part of a scheme that asks for larger deposits later.'), [
    question('What is a warning sign in recruitment?', ['Written role details', 'An independently verifiable employer', 'Paying to unlock your wages'], 2, 'A fee to receive earnings is a reason to pause and investigate.'),
    question('Is a displayed task balance proof of withdrawable money?', ['No, it is only the platform’s claim', 'Yes, if the digits animate', 'Yes, if a recruiter sends a screenshot'], 0, 'Verify actual transactions in your own account.'),
    question('Who can help verify a student job?', ['Only the recruiter', 'Your campus placement team', 'A stranger selling recovery services'], 1, 'Use an independent source with a reason to protect your interests.'),
  ], ['Verify employers independently before sharing documents.', 'Do not pay to release task earnings.']),
  lesson('upi-refunds', 'Understand a UPI refund request', 'Payments & identity', 'Know the difference between receiving money and approving a debit.', [
    'Read the action in your own UPI app: a collect request asks you to pay. Do not rely on a caller calling it a refund or reward.',
    'You do not need to enter a UPI PIN simply to receive money. A PIN usually approves an outgoing action. Never share it or show your screen while entering it.',
    'Check successful transactions inside your own banking or UPI app. Screenshots and payment-sound recordings can be fabricated. If a refund is expected, contact the original merchant through its official service.',
  ], question('Your app shows “Pay Rs 849” but the chat agent calls it a refund. Which do you trust?', ['The action shown in your own app', 'The agent’s profile picture', 'The word refund in the chat'], 0, 'Approving a payment sends money even if a caller describes it differently.'), [
    question('Do you need a UPI PIN just to receive money?', ['Yes, every time', 'No', 'Only for large refunds'], 1, 'Do not enter a PIN for someone else’s claim that you are receiving money.'),
    question('What confirms that an incoming payment reached you?', ['A buyer’s screenshot', 'A message saying paid', 'Your own transaction record'], 2, 'Check the transaction in an independently opened banking app.'),
    question('What does a collect request ask you to do?', ['Approve paying money', 'Change your SIM card', 'Receive a guaranteed refund'], 0, 'Read the recipient and amount before approving any request.'),
  ], ['Check your app’s pay/receive wording.', 'Keep your UPI PIN private.']),
  lesson('passkeys-mfa', 'Add another lock to your account', 'Account safety', 'Use passkeys or a second factor and plan for recovery.', [
    'A reused password can put several accounts at risk after one leak. Use a password manager to create a different password for each account.',
    'Multi-factor authentication adds another check. Authenticator apps and security keys can offer stronger protection than a password alone. Passkeys are tied to the genuine service and can help resist phishing.',
    'Set up recovery before you need it: review your recovery email and phone, and store backup codes safely. Never send a recovery code to someone claiming to be support.',
  ], question('You can improve only one thing today. Your email password is reused and MFA is off. What helps?', ['Add your birthday to it', 'Use a unique password and enable MFA', 'Share it with a trusted classmate'], 1, 'Email often controls recovery for other accounts, so securing it has broad value.'), [
    question('Why use different passwords?', ['They are easier to guess', 'They stop all scams', 'One leaked password will not unlock every account'], 2, 'Unique passwords reduce the damage from password reuse.'),
    question('Where should backup codes go?', ['In a public note', 'In a safe private place you can recover', 'In a reply to support'], 1, 'Recovery codes are secrets that can help regain account access.'),
    question('What is an advantage of passkeys?', ['They are tied to the genuine service', 'They make all messages safe', 'They require you to share a PIN by chat'], 0, 'Service binding helps resist phishing, but you still need good recovery practices.'),
  ], ['Secure your primary email with MFA or a passkey.', 'Review recovery options and store backup codes privately.']),
  lesson('public-wifi', 'Use public Wi-Fi with care', 'Device & privacy', 'Check the network and avoid unexpected installation prompts.', [
    'An attacker can choose a network name that resembles a cafe or campus network. Ask staff for the correct name; a familiar-looking name is not enough.',
    'Do not install a certificate, profile or “Wi-Fi helper” from an unexpected sign-in page. Do not enter your main email password into a network portal.',
    'Keep your device updated and prefer mobile data for sensitive tasks when you cannot verify a network. HTTPS protects connections but does not make a deceptive website trustworthy.',
  ], question('A cafe Wi-Fi portal asks for your email password. What should you do?', ['Use a shorter password', 'Type it only once', 'Stop and ask staff for the genuine access process'], 2, 'A Wi-Fi portal should not need the password to your email account.'), [
    question('How can you check a public network name?', ['Ask venue staff', 'Choose the strongest signal', 'Choose the word secure'], 0, 'Network names and signal strength can be imitated.'),
    question('What should you do with an unexpected certificate prompt?', ['Accept to improve speed', 'Decline and verify the network', 'Share it with every device'], 1, 'Installing trust settings can affect device security.'),
    question('Does HTTPS prove a page is genuine?', ['Yes', 'Only on Wi-Fi', 'No; it protects the connection'], 2, 'A malicious or misleading site can still use HTTPS.'),
  ], ['Disable automatic joining for networks you no longer use.', 'Use mobile data when you cannot verify a network.']),
  lesson('social-privacy', 'Choose who sees your information', 'Device & privacy', 'Reduce exposure without needing to disappear from social media.', [
    'Public posts can reveal your location, college, routine and people you trust. Those details may help someone make a scam feel personal.',
    'Review audience settings for your profile and old posts. Avoid sharing live travel details, full identity documents or tickets with scannable codes. Ask others before posting their photos.',
    'Check connected apps and account-discovery settings. A smaller audience reduces exposure, but screenshots can still escape a private group. Share only what you are comfortable others keeping.',
  ], question('You want to post a boarding pass photo. What is safer?', ['Post the full barcode', 'Skip the document image and share a simple update later', 'Cover only the airline logo'], 1, 'Travel documents can contain identifiers and scannable information you do not need to share.'), [
    question('Why can public routine details matter?', ['They can make impersonation more convincing', 'They guarantee a hack', 'They improve passwords'], 0, 'Specific personal details can be used to build a believable pretext.'),
    question('Is a private group a guarantee against copying?', ['Yes', 'Only if it is small', 'No, members can take screenshots'], 2, 'Audience controls help, but they do not prevent every copy.'),
    question('What should you do before posting a friend’s photo?', ['Tag their address', 'Ask for consent', 'Publish their timetable'], 1, 'Respecting someone else’s privacy includes asking where their image can be shared.'),
  ], ['Review audiences on old posts.', 'Remove third-party apps you no longer use.']),
  lesson('fake-apps', 'Check an app before installing', 'Device & privacy', 'Look beyond the icon and review permissions.', [
    'An app’s name or logo can resemble a legitimate service. A download link from a message may deliver a different app from the one you expect.',
    'Use official stores or an independently verified publisher site. Check the developer and permissions. A calculator or loan quote should not automatically need broad access to your contacts and photos.',
    'Be especially cautious with accessibility, notification-reading and remote-control access. If you installed something suspicious, revoke permissions and seek help through trusted device-support instructions.',
  ], question('An unverified loan app needs every contact before showing fees. What is the best response?', ['Allow now and read later', 'Send your contacts in chat instead', 'Pause and verify the lender and necessity of access'], 2, 'Broad access can expose you and other people; understand the purpose before granting it.'), [
    question('What should you check besides an app icon?', ['Developer identity and permissions', 'Only the download animation', 'Only the colour'], 0, 'Lookalike icons do not establish who published an app.'),
    question('Which permission deserves particular care?', ['Dark-mode preference', 'Accessibility or remote-control access', 'Font size'], 1, 'Powerful permissions can let an app observe or control sensitive actions.'),
    question('Where is a safer place to begin an app download?', ['An urgent stranger’s link', 'A forwarded attachment', 'An official store or verified publisher site'], 2, 'Verify the source independently and still review the app’s requests.'),
  ], ['Remove apps you do not recognise.', 'Review sensitive app permissions.']),
  lesson('account-takeover', 'Respond to a suspicious login', 'Account safety', 'Recognise code-forwarding tricks and recover through trusted settings.', [
    'A familiar contact can be a compromised account. If someone asks you to forward a login code that “arrived by mistake”, do not share it. The code may be for your account.',
    'For an unexpected login alert, open the service yourself and review active sessions. If you see a device you do not recognise, follow the service’s sign-out and recovery steps.',
    'Change a compromised password to a unique one and review recovery details, forwarding rules and connected apps. Warn contacts through a trusted channel if your account sent scam messages.',
  ], question('A friend urgently asks for the login code on your phone. What is safest?', ['Do not send it; contact them through a known alternative route', 'Send it because you know the avatar', 'Post it in the group'], 0, 'Their account may be compromised, and the code may protect your own login.'), [
    question('Where should you review a suspicious session?', ['A link in an unknown message', 'The account settings you open independently', 'A paid recovery chat'], 1, 'Use the genuine service’s own security and recovery tools.'),
    question('What else should you check after a takeover?', ['Only your wallpaper', 'Only your display name', 'Recovery details, connected apps and forwarding rules'], 2, 'Changes there can preserve an attacker’s access even after a password reset.'),
    question('Can a familiar profile be controlled by someone else?', ['Yes, an account can be compromised', 'No, avatars verify people', 'Only if the photo disappears'], 0, 'Verify unusual requests through a separate known channel.'),
  ], ['Review signed-in devices.', 'Turn on a second verification step.']),
  lesson('data-leaks', 'Act on a leak without panic', 'Account safety', 'Reduce the harm from exposed or reused information.', [
    'A data leak may expose email addresses, passwords or other records. Receiving a threatening message that includes old information does not prove the sender controls your current device.',
    'Change an exposed or reused password through the genuine service, then update other accounts that used it. Start with email and financial accounts. Enable MFA and review active sessions.',
    'Be sceptical of promises to erase every copy of leaked data for a fee. Preserve evidence of threats and avoid sending more secrets. An AI check cannot confirm that your device or account is uncompromised.',
  ], question('A message quotes an old password and demands payment. What is useful?', ['Reply with your new password', 'Change reused passwords via official settings and review access', 'Pay for a promise to erase every copy'], 1, 'Old leaked information is a reason to secure accounts, not to reveal more secrets.'), [
    question('Does an old password in a threat prove current device access?', ['Always', 'Only at night', 'No, it may come from an old leak'], 2, 'Check account activity independently; do not accept the sender’s explanation as proof.'),
    question('Which accounts should you prioritise?', ['Primary email and financial accounts', 'Only unused games', 'None until another threat arrives'], 0, 'These accounts can control money and recovery for other services.'),
    question('Can a stranger guarantee every leaked copy is erased?', ['Yes, for a high fee', 'No', 'Yes, if they know your name'], 1, 'Do not pay for claims that cannot realistically be verified.'),
  ], ['Replace reused passwords.', 'Review security alerts and session history through official settings.']),
];
