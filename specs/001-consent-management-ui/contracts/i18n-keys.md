# Contract: interface text keys

Each host adds a `consent` object to every file in `src/assets/`:

- HWC-UI: `English.json`, `Hindi.json`, `Assamese.json`, `Kannada.json`
- MMU-UI: `English.json`, `Hindi.json`, `Assamese.json`
- TM-UI: `English.json`, `Hindi.json`, `Assamese.json`

Components read the keys as `currentLanguageSet?.consent?.<key>`. Notice text is **not** here; it comes
from the notice API in the patient's language.

| Key | English |
| --- | --- |
| `title` | Patient consent |
| `chooseLanguage` | Choose the patient's language |
| `playAudio` | Play notice aloud |
| `noticeDataItems` | What data we collect |
| `noticeRetention` | How long it is kept |
| `noticeRecipients` | Who it is shared with |
| `noticeWithdrawal` | How to withdraw |
| `noticeGrievance` | How to complain |
| `readToEnd` | Read or play the notice to the end to continue |
| `mandatory` | Required for this service |
| `optional` | Optional |
| `mode` | How was consent taken? |
| `modeSelfRead` | Patient read it |
| `modeReadAloud` | Read aloud to patient |
| `modeVoiceClip` | Voice recording |
| `modeWitnessed` | Witnessed |
| `modeSignaturePhoto` | Signature or thumb + photo |
| `modeOtp` | OTP to patient's phone |
| `workerConfirm` | I read the full notice to the patient |
| `recordVoice` | Record 30–60 seconds |
| `voiceTooShort` | Recording must be at least 30 seconds |
| `voiceTooLong` | Recording must be at most 60 seconds |
| `witnessName` | Witness name |
| `witnessRelationship` | Relationship to patient |
| `patientPhoto` | Photo of patient |
| `signedFormPhoto` | Photo of signed / thumb-printed form |
| `takePhoto` | Take photo |
| `stopRecording` | Stop recording |
| `retake` | Retake |
| `upload` | Upload instead |
| `phoneNumber` | Phone number |
| `enterOtp` | Enter OTP |
| `resendIn` | Resend in |
| `otpVerified` | OTP verified |
| `sendOtp` | Send OTP |
| `verifyOtp` | Verify |
| `otpSentTo` | OTP sent to {phone} |
| `otpInvalid` | Wrong or expired OTP |
| `guardianTitle` | Guardian consent |
| `guardianName` | Guardian name |
| `guardianRelationship` | Relationship |
| `guardianPhone` | Guardian phone |
| `guardianNoPhone` | Guardian has no phone / OTP failed |
| `guardianIdSighted` | ID seen by staff |
| `guardianWitnessSignature` | Witness + signature |
| `accept` | Accept |
| `decline` | Decline |
| `close` | Close |
| `cannotContinue` | Without consent for the required purposes, this service cannot continue. |
| `confirmDecline` | Confirm decline |
| `staleReload` | This patient's consent was changed elsewhere. Reload and confirm. |
| `serviceUnavailable` | Consent service is unavailable. Nothing has been saved. |
| `retry` | Retry |
| `notSynced` | Not synced |
| `consentButton` | Consent |
| `pendingBanner` | Consent pending |
| `pendingCONSENT_MISSING` | No consent on record |
| `pendingLEGACY` | Consent taken before DPDP; ask again |
| `pendingRECONSENT_REQUIRED` | Notice changed; ask again |
| `pendingGUARDIAN_TO_SELF` | Patient is now 18; ask for own consent |
| `prefTitle` | Consent preferences |
| `statusGRANTED` | Granted |
| `statusDENIED` | Denied |
| `statusWITHDRAWN` | Withdrawn |
| `statusEXPIRED` | Expired |
| `statusRECONSENT_REQUIRED` | Re-consent needed |
| `validUntil` | Valid until |
| `withdraw` | Withdraw |
| `withdrawAll` | Withdraw all |
| `withdrawImplications` | Reminders, sharing and doctor access for these purposes stop at once. |
| `notWithdrawable` | This purpose is required by law and cannot be withdrawn. |
| `history` | History |
| `doctorAccess` | Doctor access |
| `revokeAccess` | Cancel access |
| `accessRequest` | Access request |
| `approveAccess` | Approve for {days} days |
| `refusalCONSENT_NOT_FOUND` | No consent on record for this action. |
| `refusalCONSENT_DENIED` | The patient declined consent for this action. |
| `refusalCONSENT_WITHDRAWN` | The patient withdrew consent for this action. |
| `refusalCONSENT_EXPIRED` | Consent for this action has expired. |
| `refusalRECONSENT_REQUIRED` | The patient must consent again. |
| `refusalGUARDIAN_REQUIRED` | A guardian must give consent. |
| `openConsent` | Open consent |
| `requestAccess` | Request access from the referral screen |

The Hindi and Assamese values are supplied by the programme's translators. Until then, hosts copy the
English values so no key is missing (SC-008).
