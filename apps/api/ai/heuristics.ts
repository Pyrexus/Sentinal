import type { AnalysisResult } from './schemas';

type Rule = {pattern:RegExp;weight:number;category:string;reason:string;severity:'low'|'medium'|'high'};
const rules:Rule[] = [
  {pattern:/\b(?:urgent(?:ly)?|immediately|within \d+ (?:minutes?|hours?)|last warning|final notice|act now)\b/i,weight:17,category:'Pressure tactics',reason:'A short deadline can pressure you to act before checking the sender.',severity:'medium'},
  {pattern:/\b(?:share|send|tell|provide|confirm|enter)\b.{0,35}\b(?:otp|pin|cvv|password|verification code)\b/i,weight:45,category:'Credential theft',reason:'Requests for secret codes or payment PINs are a serious warning sign. Do not share them.',severity:'high'},
  {pattern:/\b(?:kyc|account)\b.{0,55}\b(?:blocked|suspend(?:ed)?|deactivat(?:e|ed)|expired|update)\b/i,weight:25,category:'Account impersonation',reason:'Scammers use account or KYC warnings to move you to an unofficial channel.',severity:'high'},
  {pattern:/\b(?:won|winner|lottery|prize|reward|free gift|guaranteed returns?)\b/i,weight:22,category:'Reward bait',reason:'Unexpected rewards can be bait for a fee, login, or payment request.',severity:'medium'},
  {pattern:/\b(?:upi|refund|receive money)\b.{0,70}\b(?:pin|scan|pay|collect request|qr)\b|\b(?:scan|pay|pin)\b.{0,70}\b(?:refund|receive money)\b/i,weight:40,category:'UPI payment manipulation',reason:'Receiving a refund does not require entering a UPI PIN or approving a payment request.',severity:'high'},
  {pattern:/\b(?:digital arrest|arrest warrant|customs seizure|money laundering|police case)\b/i,weight:32,category:'Authority impersonation',reason:'Threats of arrest over a call or message are used to create fear. Independently verify and stop any transfer.',severity:'high'},
  {pattern:/\b(?:registration fee|security deposit|task commission|pay to unlock|processing fee|recharge to withdraw)\b/i,weight:25,category:'Advance-fee scam',reason:'Upfront payments to obtain a job, scholarship, payout, or prize need independent verification.',severity:'high'},
  {pattern:/\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy)\/[\w-]+/i,weight:20,category:'Hidden destination',reason:'A shortened link hides its destination. Open the organisation’s official app yourself.',severity:'medium'},
  {pattern:/\b(?:install|download)\b.{0,50}\b(?:apk|remote access|screen shar(?:e|ing)|support app)\b/i,weight:35,category:'Unsafe app request',reason:'Installing unknown apps or sharing your screen can expose messages, banking details, and device controls.',severity:'high'},
  {pattern:/https?:\/\/[^\s/]*(?:xn--|\d{2,})[^\s/]*/i,weight:15,category:'Unusual domain',reason:'The link has an unusual domain. This alone is not proof of harm; compare it with an official source.',severity:'medium'},
  {pattern:/\b(?:ignore (?:all |previous |the )?instructions|system prompt|say (?:this is |it is )?safe)\b/i,weight:20,category:'Instruction manipulation',reason:'The message contains instructions intended to influence this check. They are treated as text, not followed.',severity:'medium'},
];

export function heuristicAnalyze(content:string):AnalysisResult {
  const redFlags:AnalysisResult['redFlags']=[];
  let score=5, category='No strong warning pattern';
  let topWeight=0;
  for(const rule of rules) {
    const match=rule.pattern.exec(content);
    if(!match) continue;
    const preceding=content.slice(Math.max(0,match.index-22),match.index);
    if(/(?:never|do not|don['’]t|avoid|not)\s*(?:ever\s*)?$/i.test(preceding)) continue;
    redFlags.push({text:match[0],reason:rule.reason,severity:rule.severity});
    score+=rule.weight;
    if(rule.weight>topWeight) {topWeight=rule.weight;category=rule.category;}
  }
  const urls=content.match(/https?:\/\/[^\s<>]+/gi)||[];
  for(const raw of urls.slice(0,4)) {
    try {
      const url=new URL(raw);
      if(url.protocol==='http:') {score+=10;redFlags.push({text:raw,reason:'This link does not use HTTPS. Avoid entering personal information; HTTPS alone would still not prove trust.',severity:'medium'});}
      if(url.username||url.password) {score+=35;redFlags.push({text:raw,reason:'Embedded credentials can disguise the real destination in a link.',severity:'high'});}
      if(/(?:bank|kyc|upi|login|scholarship|refund)/i.test(url.hostname)&&url.hostname.split('.').length>3) {score+=15;redFlags.push({text:raw,reason:'Extra domain labels can make a link look official. Check the actual registered domain independently.',severity:'medium'});}
    } catch { /* Invalid URLs remain untrusted text and are never fetched. */ }
  }
  score=Math.min(98,score);
  const verdict=score>=65?'High':score>=30?'Medium':'Low';
  return {
    riskScore:score,verdict,category,redFlags:redFlags.slice(0,12),source:'heuristic',
    explanation:redFlags.length ? `This message has ${redFlags.length} warning ${redFlags.length===1?'pattern':'patterns'} commonly used to rush, mislead, or request sensitive information. This basic check cannot verify the sender or destination.` : 'This basic check did not find a strong warning pattern. It cannot verify the sender, a link, or whether a request is genuine.',
    nextSteps:redFlags.length ? ['Pause. Do not reply, pay, open attachments, or share an OTP, PIN, password, or CVV.','Open the official app or type the known official website yourself to verify the request.','If you have shared money or account access, contact your bank through its official app or the number printed on your card.'] : ['Confirm unexpected requests using an official app or a contact you already trust.','Keep OTPs, PINs, passwords, and CVVs private.'],
    confidence:'low',uncertainty:'I can’t be certain. Basic check (AI unavailable): patterns can miss a scam or flag an innocent message. A low score is not a safety guarantee.',
    safeBrowsing:{status:'not_configured',detail:'URL reputation was not checked. Links are never opened by Sentinel.'},
  };
}
