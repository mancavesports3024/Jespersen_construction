# LEGAL-05 review draft

Unpublished working notes for Jespersen Construction. This is not a posted privacy policy, terms page, or cookie banner. It does not rewrite insurance advertising or contract cancellation language.

Branch: `codex/legal-05-private-content`. Live Blob data was not changed.

## 1. Public Blob trace

| Path | Store | Read | Write |
|---|---|---|---|
| `site-content.json` | Existing public store, `BLOB_READ_WRITE_TOKEN`, `access: 'public'` | `head` plus fetch of the public URL. `/api/content` does not call the private store | Authenticated `PUT /api/admin/content`, only after the private store write succeeds |
| `uploads/{id}-{filename}` | Same public store | Portfolio images use the returned public URL | Authenticated `POST /api/admin/upload-image` |
| `admin/search-results.json` | Separate private store, `PRIVATE_BLOB_READ_WRITE_TOKEN`, `access: 'private'` | `get` with `useCache: false`, and only from an authenticated admin request | `saveContent`, before the public object is written |

Vercel access is chosen per store and cannot be changed later. A public store rejects private writes, and a private store rejects public writes. The code passes each store's token explicitly. An explicit `token` takes priority over the default OIDC store (`BLOB_STORE_ID` / `VERCEL_OIDC_TOKEN`), so connecting a second store does not redirect public content. Official references: [private storage](https://vercel.com/docs/vercel-blob/private-storage) and [Blob authentication](https://vercel.com/docs/vercel-blob/using-blob-sdk).

`searchResults` (title, description, and rows of query, clicks, impressions, position, and notes) is admin data. Unknown fields such as a customer email are dropped by `normalizeContent` and are not stored.

Public pages keep reading the public store when `PRIVATE_BLOB_READ_WRITE_TOKEN` is missing. Admin Save fails in that case, and when the two tokens are the same, before either store is written. A failed private write also leaves the public object unchanged. A failed public write can leave notes in the private store; the public file is not overwritten, so any legacy copy remains there.

This code was not run against the live stores and does not create a store.

### Migration and recovery

No automatic migration runs. Legacy notes, if present, stay inside the public `site-content.json` until the first successful admin Save after the private token is set. That Save writes the notes to the private store, then rewrites the public object without `searchResults`. The October 11 review found an empty `searchResults` list in the live public file. Download that file from the public Blob dashboard before the first post-deploy Save anyway, because this code does not keep an older copy.

1. Leave the existing public store and `BLOB_READ_WRITE_TOKEN` as they are.
2. Create a new Blob store with access **Private**. Do not change the public store's access.
3. Connect the private store to project `jespersen-construction`. In Advanced Options, set the environment variable prefix to `PRIVATE_` so Vercel creates `PRIVATE_BLOB_READ_WRITE_TOKEN` and does not replace `BLOB_READ_WRITE_TOKEN`. If the dashboard shows another name, put the private store's read-write token in `PRIVATE_BLOB_READ_WRITE_TOKEN` yourself.
4. Confirm the two token values are different. Redeploy. This branch does not do those steps.
5. Sign in at `/admin` and Save once.
6. If Save reports a missing token or the same token for both stores, nothing was written. Fix the variables and Save again.
7. If the private write fails, the public file is unchanged.
8. If the private write succeeds and the public write fails, Save reports that the notes were saved in the private store and public content was not updated. The previous public file is still there. Fix the public token and Save again. Do not delete the private object. Reloading admin shows the private notes with the last successful public content.
9. Unsigned requests get 401 and do not read the private store. The private URL is not publicly readable.

## 2. Draft contact and privacy notice

Do not publish this text until the pending facts in section 4 are filled in. It describes only the inquiry path verified in source.

### Contact form notice

When you use the inspection form, this site sends your name, email address, phone number if you enter one, and the message you type. The message box asks for your city and project details, including anything your insurance company sent you. The form does not upload files.

The message is emailed to the business address published on the contact page. Email delivery uses Gmail. The website host, Vercel, processes the submission in order to send that email. Messages that look like spam may be ignored. When that happens, the site may record the IP address, and sometimes the email address, in hosting logs.

To send an estimate or photos, the insurance page says to email them to the same published Gmail address, or to describe them in this form.

### Short privacy notice

Jespersen Construction uses this website to describe roofing and exterior work and to receive inspection requests.

The contact form collects the fields listed above and emails them through Gmail. The site does not create a customer account and does not take payment online. Public pages do not load advertising or analytics cookies. A password-protected admin page sets its own login cookie after an administrator signs in.

Editable service, project, and about text, and project photos uploaded by an administrator, are stored so the public site can show them. Admin search notes are stored separately and are not part of the public page content.

Pending: legal business name, how long messages and emailed documents are kept, how to ask for deletion, whether anyone outside the business reads the mailbox, whether estimates or photos are put into an outside AI tool, and which project photos may be published.

## 3. Insurance-claim and supplement advertising

Inventory only. Page text was not changed. Counsel should compare these statements with RSMo 407.725 and Oklahoma roofing and public-adjuster rules before any wording is edited. No deductible-rebate offer was found. Contract cancellation notices were not found in the website source; those belong on insurance-paid contracts, which are not in this repository.

### Strongest statements

| Location | What it says |
|---|---|
| `index.html` lines 7, 14, 20, 35 | Meta and structured data: “Insurance claim help Joplin MO, AI-assisted estimate review” and “AI-assisted insurance analysis.” |
| `index.html` lines 94–97 | FAQ schema: “Yes. We provide insurance claim help in Joplin MO including AI-assisted estimate review and adjuster-ready documentation.” |
| `index.html` lines 150, 163, 180, 190, 200–201, 225, 235–236, 278 | Visible claims: AI-assisted insurance claim help, “Insurance documentation & supplements,” “supplement support when estimates are thin,” and “Estimate review, supplements, and how to upload paperwork.” Line 180 also says this is “not a promise of payment.” |
| `insurance-claims.html` lines 6–9, 22–24, 35–38 | Title and schema: “Insurance claim help,” “supplement support when scopes are incomplete,” and “AI-assisted comparison.” Line 38 says this is “without replacing your adjuster or guaranteeing payment.” |
| `insurance-claims.html` lines 42–46 | “We are a roofing and exterior contractor helping you present accurate information. We do not act as a public adjuster unless separately licensed in your jurisdiction.” |
| `insurance-claims.html` lines 149–150, 161–162, 177–178, 185, 200–201 | Visible copy repeats AI-assisted review, supplement support, the public-adjuster disclaimer, and instructions to email an estimate or photos. |
| `ai-insurance-assistance.html` lines 7–9, 51–53, 71 | “AI-assisted insurance estimate review,” “supplement support,” “what might need a supplement,” “roof insurance claim assistance,” and “no promise of payment.” Line 71 says the company does not replace a licensed public adjuster where one is required. |
| `faq.html` lines 24–27 and 108–109 | “Yes. We help with documentation, supplements, and adjuster-ready photos and measurements.” |
| `faq.html` lines 32–35 and 112–113 | Services include “AI-assisted insurance estimate review.” |
| `blog/how-insurance-claims-work-roof-damage.html` lines 9, 66–68, 76–78 | “Your contractor can request a supplement” and “Your contractor submits it; the carrier reviews.” Also says AI-assisted tools “compare scopes to typical repair needs.” |
| `blog/what-to-do-after-hail-damage-joplin-mo.html` lines 78 and 83 | “insurance claim help” and “may request supplements for code-required work or missed line items.” |
| `services/index.html` lines 9, 53, 68, 102, 111–112 | “AI-powered insurance support,” “supplements when scopes are thin,” and “AI-driven claim review … helps you secure a fair, complete claim.” |
| `services/storm-restoration.html` lines 68, 78, 106 | “Insurance claim help” and “line-item notes that explain why a valley needs full replacement.” |
| `services/roofing.html` lines 68, 91, 136 | “insurance claim help includes organized line items and photos adjusters can use.” |
| `services/our-process.html` lines 58, 80, 84 | “we map damage to line items carriers recognize” and “adjuster-ready photos, measurements, and notes for insurance claim help.” |
| `services/siding-and-exterior.html` line 90 | “When siding or gutters are part of a claim, we document visible loss clearly for insurance claim help.” |
| `about.html` lines 54, 76, 104 | Insurance documentation, “Insurance claim help,” and “AI-assisted estimate review to help spot missed line items.” |
| `roof-repair-joplin-mo.html` line 71 | “We help align field evidence with your carrier’s process” and “We do not guarantee claim outcomes.” |
| `storm-damage-repair-joplin-mo.html` lines 57, 67 | “Insurance claim help Joplin MO” and “AI-assisted insurance review.” |
| `siding-contractor-joplin-mo.html` line 67 | “If you are filing a claim, we document visible storm damage” and “no invented damage.” |
| `roofing-contractor-webb-city-mo.html` lines 9, 70 | Meta “insurance claim help” and “compare the carrier’s estimate to field conditions.” |
| `roofing-contractor-carthage-mo.html` lines 14, 70 | “insurance claim help” and “AI-assisted estimate review.” |
| `roofing-contractor-neosho-mo.html` lines 9, 70 | “Insurance claim help” and “line-item notes that align with what we will actually install.” |
| `why-us.html` lines 68, 74 | “straight answers on timeline, insurance paperwork, and options.” |
| `service-area.html` line 108 | “help understanding an insurance estimate.” |
| `blog/index.html` lines 62, 66 | Index blurb for supplements and a link labeled “insurance claim help Joplin MO.” |
| `data/default-content.js` lines 5, 12, 27–28, 34–36, 74, 77 | Homepage text served through `/api/content` when saved content is missing or matches these defaults: “AI-powered insurance support,” “supplements when scopes are thin,” “AI-driven claim review,” and “supplement support when estimates are incomplete.” |

Navigation labels that say “Insurance” or “Insurance claim help” also appear in the headers and footers of these pages. They point at `/insurance-claims` and do not add a separate promise.

## 4. Owner decisions still open

- Legal name and entity. The site says Jespersen Construction. The repository title and published mailbox use Jespersen Erections. Street address is unpublished.
- Licenses and insurance that support “licensed and insured,” and whether anyone is a licensed public adjuster in Missouri, Arkansas, Oklahoma, or Kansas.
- How long Gmail inquiries, emailed estimates, photos, and Vercel logs are kept, who can read that mailbox, and how a customer can ask for deletion.
- Whether estimates or photos are pasted or uploaded into an outside AI tool, and whether that vendor keeps them.
- Which public project photos may show a customer’s home, face, address, or paperwork.
- Whether the company sells or shares customer information, or sends marketing email or texts. This draft does not claim either way.
- Create the private Blob store and set `PRIVATE_BLOB_READ_WRITE_TOKEN` as described in section 1. Do that before the first admin Save on this code. This branch does not create the store or change production settings.
- Counsel review of section 3 before any insurance sentence is changed.
