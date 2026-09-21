You are a senior full-stack product engineer and UX designer.

I am creating an interactive onboarding workshop for new Coding Instructors joining the iSchool B2B team.

The audience is:

* Age: 22–25
* Male and female
* Young professionals / fresh graduates applying to become Coding Instructors
* They will attend an online workshop
* The workshop goal is to help them understand how to behave professionally in a B2B environment and become reliable, adaptable, communicative employees.

I do NOT want a normal presentation or static quiz.

I want you to build a REAL-TIME INTERACTIVE WEB GAME PLATFORM that I can use during the live workshop.

==================================================

1. CORE EXPERIENCE
   ==================================================

The platform should have two completely different experiences:

A) FACILITATOR / HOST SCREEN
B) PARTICIPANT / PLAYER SCREEN

The facilitator opens the game on a laptop and shares their screen during the online meeting.

The participants scan a QR code displayed on the facilitator's screen.

After scanning:

Participant → enters their name → joins the current game room.

The facilitator should be able to see how many participants joined.

The facilitator controls the game.

Participants answer questions from their phones.

Answers should appear in REAL TIME on the facilitator screen.

The facilitator can move to the next question.

After each question:

* Show live answer distribution
* Show correct answer
* Show explanation / learning point
* Award points
* Update leaderboard

The experience should feel closer to:

* Kahoot
* Mentimeter
* Jackbox
* Sporcle Party

but specifically designed for our iSchool B2B onboarding workshop.

==================================================
2. IMPORTANT PRODUCT PRINCIPLE
==============================

These games are NOT just entertainment.

Every game must teach one workplace behavior.

The flow should be:

GAME
↓
DECISION
↓
RESULT
↓
DISCUSSION
↓
LESSON

The facilitator should have a short "Debrief" section after every scenario explaining what the participants should learn.

Do NOT make the games feel like corporate training software.

The UI should feel modern, young, playful and competitive.

Target feeling:

"Netflix/Spotify/Kahoot/modern startup"
NOT
"boring HR portal."

==================================================
3. TECH REQUIREMENTS
====================

Build this as a production-ready web application.

Preferred stack:

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* modern component architecture
* Framer Motion or another lightweight animation solution where useful

Backend:

* Node.js
* Express
* real-time communication using Socket.IO

Database:

* Use a simple database solution suitable for deployment.
* Prefer Supabase/PostgreSQL if appropriate.
* If a simpler architecture is more reliable, explain the choice.

The application must support:

* Real-time rooms
* Unique room codes
* QR-code joining
* Multiple participants
* Real-time answers
* Real-time leaderboard
* Host controls
* Participant state synchronization

Do NOT build a fake "real-time" experience using only local state.

Multiple devices must actually communicate with each other.

==================================================
4. ROOM SYSTEM
==============

When the facilitator starts a game:

Generate a short room code such as:

B2B7X

The facilitator screen displays:

JOIN THE GAME

Scan the QR code

or

Go to:
[website]

Enter code:

B2B7X

The QR code should encode the participant join URL.

Example:

https://yourdomain.com/join/B2B7X

The participant should not need an account.

Participant flow:

Scan QR
→ Enter name
→ Join
→ Waiting room
→ Host starts game
→ Question appears
→ Answer
→ Wait
→ Results
→ Next question

==================================================
5. FACILITATOR DASHBOARD
========================

Create a dedicated facilitator interface.

The host should be able to:

* Create a new game
* Select a game
* Generate room
* Display QR code
* See participants joining
* Start game
* Pause game
* Move to next question
* Reveal answer
* Show explanation
* Award / modify points if needed
* Skip question
* Restart question
* End game
* Show final leaderboard

The host screen should be optimized for screen sharing.

Important:

The facilitator should NOT need to use a mouse constantly.

Make controls obvious and large.

Suggested controls:

[START GAME]

[NEXT QUESTION]

[REVEAL ANSWER]

[SHOW RESULTS]

[NEXT]

[LEADERBOARD]

==================================================
6. PARTICIPANT EXPERIENCE
=========================

The participant interface is mobile-first.

They should be able to play comfortably on:

* iPhone
* Android
* small screens
* mobile browser

Do NOT require app installation.

Participant UI should be extremely simple.

Example:

---

B2B READY, SET, GO!

Room: B2B7X

👋 Hey Tohamy!

Waiting for the host...

---

Then:

QUESTION 03

You are currently preparing tomorrow's session.

Your mentor suddenly asks:

"Can you cover another session in 30 minutes?"

What do you do?

[A]
Sure, I'll handle it.

[B]
I can't.

[C]
Check my current commitment, clarify what's needed, then confirm whether I can realistically take it.

---

Once the participant answers:

"Answer submitted ✓"

Do not allow changing the answer unless the host enables it.

==================================================
7. SCORING
==========

Create a competitive scoring system.

Possible scoring:

Correct answer = 1000 points

Bonus points for speed.

However:

DO NOT make speed more important than judgment.

A participant who chooses the professional answer slightly later should not be heavily punished.

Use a reasonable scoring formula.

Show:

+850

Nice decision 🔥

Leaderboard should update after every question.

Example:

🏆 LEADERBOARD

1. Ahmed — 4,850
2. Sara — 4,620
3. Omar — 4,300
4. Menna — 4,050

Add small animations when rankings change.

==================================================
8. GAME 1 — "URGENT OR FAKE URGENT?"
====================================

Topic:
Prioritization

Purpose:
Teach participants to distinguish actual urgency from something that simply sounds urgent.

Gameplay:

Show multiple simultaneous requests.

Example:

You currently have several things happening:

🔴 A mentor needs confirmation about a session starting soon.

🟠 A teammate asks you to review something.

🟡 An admin task needs to be completed today.

🔴 Another task is described as "URGENT."

Participants must rank or choose what they would handle first.

IMPORTANT:

Do not simply mark one answer as "smart" without explanation.

After the result:

Reveal additional information.

Example:

"UPDATE: The supposedly urgent presentation is actually due tomorrow."

Then ask them to reconsider.

This makes the game dynamic.

Learning:

Before switching tasks:

* What is the real deadline?
* What is the impact?
* Who decides the priority?

==================================================
9. GAME 2 — "THE PLOT TWIST"
============================

Topic:
Adaptability

The participant receives a normal workplace situation.

Then the situation changes every round.

Example:

ROUND 1:

You prepared a Grade 5 session for tomorrow.

Then:

PLOT TWIST #1:
The session time changed.

PLOT TWIST #2:
The class is now Grade 3.

PLOT TWIST #3:
Some materials are missing.

PLOT TWIST #4:
You have another task due at the same time.

PLOT TWIST #5:
Your mentor needs confirmation now.

The player must decide what to do after each update.

The game should visually feel like a "breaking news / unexpected event" experience.

Learning:

Pause
→ Clarify
→ Decide & Confirm

==================================================
10. GAME 3 — "OOPS! I DID IT AGAIN"
===================================

Topic:
Ownership + Mistakes

Scenario:

You accidentally sent the wrong material to a session.

Give participants several possible reactions:

A:
Ignore it and hope nobody notices.

B:
Blame someone else.

C:
Inform the relevant person, correct the mistake, and prevent it from happening again.

D:
Wait until someone asks about it.

After they answer:

Introduce a new development.

"THE SESSION HAS ALREADY STARTED."

Then ask:

"What do you do now?"

Then:

"THIS IS THE THIRD TIME THIS HAS HAPPENED."

Ask:

"Is this still just a mistake, or is there now a recurring issue that should be raised?"

Learning framework:

NOTICE
→ INFORM
→ FIX
→ PREVENT

==================================================
11. GAME 4 — "WHATSAPP COURT"
=============================

Topic:
Communication & Professionalism

This game should feel funny and familiar to Egyptian young professionals.

Show workplace messages.

Example:

Mentor:

"Can you cover tomorrow's session?"

Response:

"مش هقدر."

Participants vote:

Professional?
YES / NO

Then show:

"I won't be able to cover tomorrow's session because I already have X at that time. If needed, I can help with Y instead."

Participants compare the two.

Create several examples.

Examples should include:

* vague replies
* late replies
* overexplaining
* passive-aggressive replies
* professional responses
* unclear commitments
* good boundary-setting

Important:

Use Egyptian conversational context, but keep the final professional wording realistic.

==================================================
12. GAME 5 — "OWN IT / SUPPORT IT / ESCALATE IT"
================================================

Topic:
Ownership + Teamwork

Show a scenario.

Participants must classify it as:

🟢 OWN IT
🟡 SUPPORT IT
🔴 ESCALATE IT

Examples:

"You forgot to send something you promised."

→ OWN IT

"Your teammate needs help and you have enough capacity."

→ SUPPORT IT

"You have been receiving the same last-minute workload problem repeatedly."

→ ESCALATE IT

"The task is bigger than your role or capacity."

→ ESCALATE IT

After every answer, explain WHY.

==================================================
13. GAME 6 — "CLARIFY BEFORE YOU COMMIT"
========================================

Topic:
Communication + Judgment

Give participants vague requests.

Example:

Mentor:

"Can you prepare the session?"

Participants have 30 seconds to identify what information they need.

Possible answers:

* Which grade?
* Which topic?
* When?
* How long?
* Online or onsite?
* Which materials?
* What outcome is expected?

Make this game about asking the RIGHT questions.

Score based on useful clarification questions.

Learning:

"Clarify before committing."

==================================================
14. FINAL GAME — "B2B ESCAPE ROOM"
==================================

This should be the final challenge.

Make it the biggest and most engaging activity.

Scenario:

🚨 B2B EMERGENCY

A session starts in 45 minutes.

Then reveal information step-by-step.

CLUE 1:
The original instructor cancelled.

CLUE 2:
You have another task due today.

CLUE 3:
Some session materials are incomplete.

CLUE 4:
The mentor needs confirmation.

CLUE 5:
Another teammate may be available.

Teams must solve the situation.

Ask:

1. What is the main issue?
2. What should happen first?
3. Who needs to be informed?
4. What would you actually say?
5. What could prevent this situation from recurring?

For the final game, allow TEAM MODE rather than individual mode.

==================================================
15. TEAM MODE
=============

The platform should support teams.

Facilitator can create:

Team A
Team B
Team C
Team D

Participants choose/join a team.

Team scores are displayed.

For certain games:

Individual mode

For final challenges:

Team mode.

The facilitator should be able to switch between modes.

==================================================
16. REAL-TIME RESULTS
=====================

After every question, facilitator sees:

Question:

Which response did participants choose?

A — 12%
B — 8%
C — 76%
D — 4%

Animate the bars.

Then:

REVEAL

Correct / Most appropriate response:

C

Then:

WHY?

Display the short facilitator explanation.

Participants should see the result on their phones too.

==================================================
17. FACILITATOR DEBRIEF
=======================

Every question must contain:

scenario
answers
correct answer
explanation
learning objective
facilitator discussion question

Example:

DISCUSSION:

"Why did you choose C?"

Then:

"Would your answer change if this happened for the third time?"

This is critical.

The platform is not only a quiz.

It is a FACILITATION TOOL.

==================================================
18. DESIGN
==========

Target audience:

Egyptian Gen Z / young millennials, age 22–25.

The visual identity should be:

* modern
* playful
* premium
* energetic
* clean
* slightly gamified
* professional enough for iSchool

Avoid:

* childish cartoon designs
* generic corporate HR templates
* excessive gradients
* boring dashboards
* huge amounts of text

Use:

* large typography
* cards
* micro animations
* progress indicators
* avatars
* emojis where appropriate
* subtle sound effects if possible
* celebration animations
* countdown timers
* live leaderboard

The UI should work beautifully in both:

16:9 facilitator screen

AND

mobile participant screen.

==================================================
19. QR CODE
===========

The facilitator screen MUST display a real QR code.

The QR should contain the actual room join URL.

Do not use a fake QR placeholder.

If possible, use a reliable QR-code library.

Include:

SCAN TO JOIN

Room Code: B2B7X

Participants should be able to scan and immediately join.

==================================================
20. GAME CREATION ARCHITECTURE
==============================

Do NOT hard-code every game directly into UI components.

Create a reusable game/question architecture.

For example:

Game

* id
* title
* description
* mode
* questions

Question

* id
* type
* scenario
* options
* correctAnswer
* explanation
* learningObjective
* discussionQuestion
* points
* timeLimit

Support question types such as:

* multiple choice
* ranking
* voting
* categorization
* rapid response
* team scenario

This will allow me to add future iSchool workshops without rebuilding the platform.

==================================================
21. ADMIN / CONTENT SYSTEM
==========================

Make the games easy to edit.

Ideally create a simple content configuration structure or admin page where I can:

* add game
* edit game
* add question
* edit question
* change answer
* change explanation
* change timer
* change points

I should not have to edit complicated React components just to change a question.

==================================================
22. WORKSHOP STRUCTURE
======================

The platform should reflect the workshop structure:

1. Welcome & Context
2. B2B Survival Challenge
3. Understanding the B2B Environment
4. Adaptability & Prioritization
5. Communication & Professionalism
6. Ownership, Teamwork & Reliability
7. B2B Reality Lab
8. Wrap-up & Reflection

The workshop is approximately 90 minutes.

Do not force the facilitator to play every game.

The facilitator should be able to select the games needed for the session.

==================================================
23. FINAL REFLECTION
====================

At the end, show:

"ONE BEHAVIOR I'LL PRACTICE"

Each participant enters one sentence.

Example:

"I'll clarify before committing."

"I'll communicate earlier when something changes."

"I'll take ownership instead of hiding mistakes."

The facilitator should be able to see the responses live.

Then show a beautiful final screen:

READY.
SET.
GO. 🚀

==================================================
24. ONLINE MEETING REQUIREMENTS
===============================

Assume the workshop happens on:

Zoom / Google Meet / Microsoft Teams.

The facilitator shares their screen.

Participants use their phones.

The game must NOT require screen sharing from participants.

Only the facilitator needs to share their screen.

Optimize the facilitator view for screen sharing.

==================================================
25. CONNECTION / ERROR HANDLING
===============================

Real workshops have bad internet.

Handle:

* participant disconnects
* refresh
* duplicate names
* host disconnect
* room expired
* invalid room code
* late joining
* question already answered
* participant reconnecting

Show friendly messages.

Example:

"Looks like you got disconnected. Reconnecting..."

Do not lose the participant's progress unnecessarily.

==================================================
26. SECURITY
============

Do not expose sensitive information.

Participants should only access their current room.

Host controls should require a host session/token.

Validate all server events.

Do not trust scores sent from the client.

Calculate important scoring on the server.

==================================================
27. DEPLOYMENT
==============

Make the application deployable.

Provide:

* frontend deployment instructions
* backend deployment instructions
* database setup
* environment variables
* production configuration
* WebSocket configuration
* QR join URL configuration

Prefer deployment platforms that are simple and affordable for a workshop.

Explain exactly how I can deploy it.

==================================================
28. DEVELOPMENT PROCESS
=======================

Do NOT immediately dump a huge amount of code.

First:

1. Analyze the requirements.
2. Propose the architecture.
3. Define the folder structure.
4. Define the database schema.
5. Define the Socket.IO events.
6. Define the game/question data model.
7. Define the user flows.
8. Then implement.

Build in milestones.

Milestone 1:
Room creation + QR + joining.

Milestone 2:
Real-time participants.

Milestone 3:
Question system.

Milestone 4:
Real-time answers.

Milestone 5:
Scoring + leaderboard.

Milestone 6:
Facilitator controls.

Milestone 7:
All workshop games.

Milestone 8:
Final polish + animations + responsive design.

After every milestone, verify that it actually works.

==================================================
29. MOST IMPORTANT REQUIREMENT
==============================

I want this to feel like a REAL PRODUCT that I could actually use in an iSchool workshop.

Not:

"Here is a demo."

Not:

"Here is a static prototype."

Not:

"Here are some buttons that simulate multiplayer."

I need:

REAL QR JOINING
REAL ROOMS
REAL MULTIPLAYER
REAL-TIME ANSWERS
REAL SCORING
REAL LEADERBOARD
REAL HOST CONTROL
REAL MOBILE EXPERIENCE

The facilitator laptop and participant phones must communicate in real time.

==================================================
30. CONTENT PRINCIPLE
=====================

Keep the scenarios realistic for a Coding Instructor working in an iSchool B2B environment.

The workshop should teach:

* adaptability
* prioritization
* professional communication
* asking for clarification
* realistic commitment
* ownership
* teamwork
* reliability
* handling mistakes
* escalation of recurring issues
* maintaining professional boundaries

The goal is NOT to teach participants to say "YES" to everything.

The goal is:

"Be adaptable, reliable, and professional — without treating every unexpected request as an obligation to sacrifice your own time or well-being."

Use this principle throughout the game design.

==================================================
31. START NOW
=============

Start by producing:

1. Product architecture
2. User flow diagram
3. Folder structure
4. Database schema
5. Socket.IO event architecture
6. Game data model
7. UI wireframe description
8. Implementation plan

Then begin implementing Milestone 1.

Do not skip the architecture.

Do not simplify the multiplayer requirement.

Build the actual foundation for a real-time workshop game platform.
