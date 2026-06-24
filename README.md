# NovaSprout Learning Starter Site

This is a low-cost custom tutoring site for NovaSprout Learning. It is built as a static Next.js export so it can run cheaply on AWS Amplify without a backend, database, or custom server.

## What is included

- Homepage for NovaSprout Learning
- Subject/service sections
- Anonymous in-house tutor profiles, without publishing private phone/address details
- One shared meeting booking button
- Intake form button for Google Forms, Tally, or another free form tool
- Resources section for videos and worksheets
- AWS Amplify config in `amplify.yml`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example:

```bash
cp .env.example .env.local
```

3. Edit `.env.local`:

```bash
NEXT_PUBLIC_BOOKING_URL=https://calendly.com/your-team/free-consultation
NEXT_PUBLIC_INTAKE_FORM_URL=https://forms.gle/your-form
NEXT_PUBLIC_CONTACT_EMAIL=novasproutlearning@gmail.com
```

4. Run the local site:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Before deploying

Create these free accounts or links:

1. Calendly
   - Create one shared "Book a meeting" event.
   - Use 30-minute "Free Consultation" events.
   - Connect Google Meet or Zoom.

2. Google Form or Tally form
   - Parent name
   - Student name
   - Student grade
   - Subject
   - Current challenges
   - Goals
   - Preferred schedule
   - Parent email

3. YouTube
   - Upload videos as unlisted.
   - Add links or embeds to the resources section later.

## AWS Amplify deployment steps

1. Push this folder to GitHub.
2. Open AWS Console.
3. Search for "Amplify".
4. Choose "Host web app".
5. Connect GitHub.
6. Pick the repo and branch.
7. For app root, choose this folder if the repo has multiple projects:

```text
novasprout-learning
```

8. Confirm build settings. Amplify should use `amplify.yml`.
9. Add environment variables in Amplify:

```text
NEXT_PUBLIC_BOOKING_URL
NEXT_PUBLIC_INTAKE_FORM_URL
NEXT_PUBLIC_CONTACT_EMAIL
```

10. Deploy.

## Domain setup

1. Buy a domain, for example:

```text
novasproutlearning.com
```

2. In Amplify, open "Domain management".
3. Add the domain.
4. Follow the DNS instructions.
5. Wait for HTTPS/SSL to finish.

## Cost-conscious choices

Keep these simple at first:

- Booking: Calendly
- Meetings: Google Meet or Zoom
- Intake: Google Forms or Tally
- Videos: Unlisted YouTube
- Email: Gmail first, Google Workspace later
- Payments: Stripe payment links later

Avoid these until you have real students:

- Student login
- Custom scheduling
- Custom video hosting
- AWS Cognito
- DynamoDB
- Paid video portal
- Tutor marketplace features

## Next features to add later

- Testimonials
- Pricing/packages
- Parent FAQ
- Embedded Calendly widget
- Private student dashboard
- Stripe payment links
- Tutor availability page

## Payments

Stripe Checkout, Stripe Payment Links, webhooks, Supabase storage, and the admin dashboard are documented in:

```text
docs/stripe-setup.md
docs/database-schema.sql
```
