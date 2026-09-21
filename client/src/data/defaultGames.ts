import { Game } from '../types/game';

export const defaultGames: Game[] = [
  {
    id: "game-1",
    title: "Game 1: Urgent or Fake Urgent?",
    subtitle: "Distinguish actual urgency from things that just sound loud",
    topic: "Prioritization",
    description: "Teach participants to assess true business impact and deadlines rather than panicking over loud requests.",
    category: "Prioritization",
    order: 1,
    questions: [
      {
        id: "g1-q1",
        type: "multiple-choice",
        title: "The Quadruple Ping",
        scenario: "It is 10:15 AM. You are preparing your slides for an 11:30 AM school session. Four notifications pop up simultaneously:\n\n🔴 A mentor pings: 'Need urgent confirmation if you can take an extra class at 2:00 PM today.'\n🟠 A teammate asks: 'Can you review my Scratch project before my class in 3 hours?'\n🟡 Admin reminder: 'Submit your weekly attendance log before 5:00 PM today.'\n🔥 WhatsApp group message: 'URGENT!! Need someone to update the slide deck ASAP!!'\n\nWhich task do you address FIRST?",
        options: [
          { id: "A", text: "Drop everything and fix the 'URGENT!!' slide deck." },
          { id: "B", text: "Help your teammate review their Scratch project immediately." },
          { id: "C", text: "Complete your 11:30 AM preparation first, then reply to the mentor about the 2:00 PM class." },
          { id: "D", text: "Rush to fill in the weekly attendance log to get admin off your back." }
        ],
        correctAnswer: "C",
        points: 1000,
        timeLimit: 45,
        explanation: "Your immediate commitment is the 11:30 AM class happening in 75 minutes. The mentor's 2:00 PM request has a clear time window, whereas 'URGENT' without context or deadline is often fake urgency.",
        learningObjective: "Prioritize by real deadline & direct classroom impact, not by who types in ALL CAPS.",
        discussionQuestion: "Why do we instinctively jump to whoever writes 'URGENT' in capital letters?",
        facilitatorTips: "Ask the room: 'Who chose A? Why does the word URGENT trigger panic?'",
        dynamicUpdate: {
          round: 2,
          announcement: "🚨 PLOT REVEAL: The person who sent 'URGENT!! slide deck' actually needs it for next Thursday's marketing meeting!",
          questionText: "Now that you know this, what is the professional rule for incoming 'urgent' tasks?",
          options: [
            { id: "A", text: "Ignore all WhatsApp messages forever." },
            { id: "B", text: "Always ask: 'What is the hard deadline and who is impacted?' before switching tasks." },
            { id: "C", text: "Complain to the team that they wasted your time." },
            { id: "D", text: "Only do what is on your calendar and refuse any changes." }
          ],
          correctAnswer: "B",
          explanation: "Clarifying deadline and impact prevents derailment from your active commitments."
        }
      },
      {
        id: "g1-q2",
        type: "multiple-choice",
        title: "The Mid-Session Distraction",
        scenario: "You are 15 minutes into teaching a live coding class with 18 students. Your mentor sends you a private Slack message:\n\n'Hey, please send me the student roster for Grade 6 right now.'\n\nWhat is your best response?",
        options: [
          { id: "A", text: "Stop the class, open Excel, find the roster, and send it immediately." },
          { id: "B", text: "Ignore the message completely until the end of the day." },
          { id: "C", text: "Give students a 2-minute independent challenge, reply quickly: 'Currently teaching live until 12:00. Will send immediately at 12:05 PM', and continue teaching." },
          { id: "D", text: "Reply with 'Busy!' and mute your laptop." }
        ],
        correctAnswer: "C",
        points: 1000,
        timeLimit: 35,
        explanation: "Classroom delivery is sacred. Never compromise student experience for back-office requests. A quick acknowledgment with an exact ETA manages expectations professionally.",
        learningObjective: "Acknowledge promptly with an ETA without abandoning your live classroom.",
        discussionQuestion: "What happens to instructor credibility when you look away from the students to do admin work?"
      }
    ]
  },
  {
    id: "game-2",
    title: "Game 2: The Plot Twist",
    subtitle: "Adaptability under pressure - breaking news rounds",
    topic: "Adaptability",
    description: "Simulates sudden real-world classroom twists. Players must pause, clarify, and adapt gracefully.",
    category: "Adaptability",
    order: 2,
    questions: [
      {
        id: "g2-q1",
        type: "rapid-response",
        title: "Breaking News: Round 1",
        scenario: "🚨 BREAKING UPDATE #1: You spent 2 hours thoroughly preparing an advanced Python session for Grade 5 scheduled at 4:00 PM.\n\nAt 3:40 PM (20 minutes before class), the B2B coordinator pings you:\n'SURPRISE: The school requested switching to Grade 3 block-based Scratch instead of Python!'\n\nWhat is your very first reaction?",
        options: [
          { id: "A", text: "Panic and tell the coordinator: 'I can't do this, find someone else.'" },
          { id: "B", text: "Pause 30 seconds. Check if you have Grade 3 Scratch materials ready in your drive, clarify student prior experience, and confirm." },
          { id: "C", text: "Teach Python anyway because that's what you prepared." },
          { id: "D", text: "Argue with the school coordinator about short notice." }
        ],
        correctAnswer: "B",
        points: 1000,
        timeLimit: 30,
        explanation: "Adaptability is our core B2B value. Pausing prevents emotional escalation, checking assets gives clarity, and confirming gives the client confidence.",
        learningObjective: "Framework: Pause → Clarify → Check Assets → Confirm.",
        discussionQuestion: "How do you keep your cool when the entire lesson plan flips 20 minutes before kickoff?"
      },
      {
        id: "g2-q2",
        type: "rapid-response",
        title: "Breaking News: Round 2 (The Tech Glitch)",
        scenario: "🚨 BREAKING UPDATE #2: You log into the classroom with the Grade 3 students. Half the students cannot open Scratch because the school firewall blocks the online editor!\n\nYou have 40 minutes left in the session. What do you do?",
        options: [
          { id: "A", text: "Cancel the class and log off." },
          { id: "B", text: "Spend 35 minutes trying to debug the school network settings on each computer." },
          { id: "C", text: "Switch seamlessly to offline Scratch Desktop if installed, or do an engaging interactive algorithmic thinking / unplugged game while the mentor alerts school IT." },
          { id: "D", text: "Tell the kids: 'Sorry, your school has bad internet' and sit silently." }
        ],
        correctAnswer: "C",
        points: 1000,
        timeLimit: 30,
        explanation: "Always have an 'unplugged' or offline fallback. Great instructors can teach computational thinking with a whiteboard, a story, or paper if technology fails.",
        learningObjective: "Never let technical failure stop learning: have an offline / unplugged contingency.",
        discussionQuestion: "What is your personal 'Plan B' when the internet completely dies during a live session?"
      }
    ]
  },
  {
    id: "game-3",
    title: "Game 3: Oops! I Did It Again",
    subtitle: "Ownership, accountability, and escalating recurring mistakes",
    topic: "Ownership + Mistakes",
    description: "Walks instructors through the Notice → Inform → Fix → Prevent framework when mistakes occur.",
    category: "Ownership",
    order: 3,
    questions: [
      {
        id: "g3-q1",
        type: "multiple-choice",
        title: "The Wrong Worksheet",
        scenario: "You just clicked 'Send' to distribute the homework and solution guide to 30 students. Two minutes later, you realize you accidentally attached the Teacher Answer Key with all solutions!\n\nWhat is your immediate course of action?",
        options: [
          { id: "A", text: "Hope no student notices or opens the PDF before tomorrow." },
          { id: "B", text: "Delete the post quietly and pretend it was a technical server glitch." },
          { id: "C", text: "Blame the curriculum team for naming the files similarly." },
          { id: "D", text: "Own it immediately: send a fun message acknowledging the mix-up, replace the file with the student worksheet, and inform your team lead." }
        ],
        correctAnswer: "D",
        points: 1000,
        timeLimit: 35,
        explanation: "Mistakes happen to everyone. Hiding mistakes destroys trust; owning them with humor and speed builds immense professional respect.",
        learningObjective: "Framework: Notice → Inform → Fix → Prevent.",
        discussionQuestion: "Why is hiding a small mistake 10x more dangerous than the mistake itself?"
      },
      {
        id: "g3-q2",
        type: "multiple-choice",
        title: "The Recurring Breakdown",
        scenario: "This is the THIRD time this month that school coordinators have sent student login credentials 5 minutes after the session was supposed to start.\n\nIs this still just a routine 'mistake to adapt to', or something else?",
        options: [
          { id: "A", text: "Just keep quiet and complain to your friends on WhatsApp." },
          { id: "B", text: "It is a systemic operational issue. Document dates/times, draft a constructive summary with suggested prevention, and escalate to your B2B Ops Lead." },
          { id: "C", text: "Refuse to start any future sessions." },
          { id: "D", text: "Yell at the school coordinator in the Zoom chat." }
        ],
        correctAnswer: "B",
        points: 1000,
        timeLimit: 40,
        explanation: "Once is an incident. Twice is a coincidence. Three times is a broken process. Professional employees escalate recurring blockers constructively with data.",
        learningObjective: "Distinguish between a one-off bump and a systemic issue that must be formally escalated.",
        discussionQuestion: "What is the difference between 'whining' to colleagues and 'constructive escalation' with your lead?"
      }
    ]
  },
  {
    id: "game-4",
    title: "Game 4: WhatsApp Court",
    subtitle: "Egyptian workplace communication - Judge the message!",
    topic: "Communication & Professionalism",
    description: "Real Egyptian workplace WhatsApp messages. Rate them as Professional vs Unprofessional and analyze realistic alternatives.",
    category: "Communication",
    order: 4,
    questions: [
      {
        id: "g4-q1",
        type: "voting",
        title: "WhatsApp Case #1: The Blunt Rejection",
        scenario: "📱 Saturday 8:00 PM. Mentor pings instructor:\n'Hey Omar! Could you cover tomorrow's 9:00 AM session at School X?'\n\nInstructor replies at 11:30 PM:\n'مش هقدر.' (Can't.)\n\nIs this message PROFESSIONAL or UNPROFESSIONAL?",
        options: [
          { id: "YES", text: "👍 Professional (Short, clear, direct)" },
          { id: "NO", text: "👎 Unprofessional (Blunt, lacks context, late, no alternative)" }
        ],
        correctAnswer: "NO",
        points: 1000,
        timeLimit: 25,
        explanation: "While setting boundaries is healthy, sending a 2-word rejection late at night gives zero context or alternative, leaving the team stranded.",
        learningObjective: "Saying NO professionally: 'I won't be able to cover tomorrow at 9 AM due to prior commitment, but I can take any slot after 1 PM or help prep materials.'",
        discussionQuestion: "How can you protect your personal time while remaining a supportive teammate?"
      },
      {
        id: "g4-q2",
        type: "voting",
        title: "WhatsApp Case #2: The Ghosting Over-Explainer",
        scenario: "📱 Mentor sends a message at 2:00 PM asking for session feedback.\nInstructor reads it immediately (blue double checks), disappears for 24 hours, then sends a 4-minute voice note explaining their personal internet issues, grocery run, and family lunch.\n\nIs this PROFESSIONAL or UNPROFESSIONAL?",
        options: [
          { id: "YES", text: "👍 Professional (They explained everything in detail)" },
          { id: "NO", text: "👎 Unprofessional (Over-explaining personal life + delayed communication)" }
        ],
        correctAnswer: "NO",
        points: 1000,
        timeLimit: 25,
        explanation: "Professional communication requires timely acknowledgment, not long emotional voice notes about personal errands. A quick 1-sentence typed reply is 100x better.",
        learningObjective: "Be concise and timely. Don't ghost then over-explain your personal life.",
        discussionQuestion: "Why do young professionals feel the need to give huge medical/personal justifications instead of simple professional timelines?"
      },
      {
        id: "g4-q3",
        type: "voting",
        title: "WhatsApp Case #3: The Proactive Boundary",
        scenario: "📱 Mentor: 'Can you take an extra 3 sessions this week in Alexandria?'\n\nInstructor: 'Thanks for thinking of me! I can commit to 1 session on Wednesday, but my university exam schedule prevents me from taking the other two. Let me know if Wednesday works so I can lock it in.'\n\nIs this message PROFESSIONAL?",
        options: [
          { id: "YES", text: "👍 Professional (Clear, appreciative, realistic boundaries)" },
          { id: "NO", text: "👎 Unprofessional (Should say yes to all sessions)" }
        ],
        correctAnswer: "YES",
        points: 1000,
        timeLimit: 25,
        explanation: "This is gold-standard B2B behavior! Warm, appreciates the offer, sets realistic constraints, and commits reliably to what they can deliver.",
        learningObjective: "Realistic commitment is better than over-promising and failing.",
        discussionQuestion: "Why is an instructor who says 'I can reliably do 1 class' more valuable than one who says 'I will do all 3' and fails to show up?"
      }
    ]
  },
  {
    id: "game-5",
    title: "Game 5: Own It / Support It / Escalate It",
    subtitle: "Rapid 3-way triage: Take responsibility, help peers, or inform leadership",
    topic: "Ownership + Teamwork",
    description: "Every workplace situation belongs to one of three categories. Train your instinct!",
    category: "Teamwork",
    order: 5,
    questions: [
      {
        id: "g5-q1",
        type: "categorization",
        title: "Scenario 1: Missed Slide Deck",
        scenario: "You promised your coordinator you would upload the updated Scratch starter files by 6:00 PM yesterday, but you completely forgot.",
        options: [
          { id: "OWN", text: "🟢 OWN IT" },
          { id: "SUPPORT", text: "🟡 SUPPORT IT" },
          { id: "ESCALATE", text: "🔴 ESCALATE IT" }
        ],
        correctAnswer: "OWN",
        points: 1000,
        timeLimit: 25,
        explanation: "You made a direct personal commitment and dropped it. Own it immediately, apologize, and deliver the files without making excuses.",
        learningObjective: "Personal commitments = 100% OWN IT.",
        discussionQuestion: "What is your instinctive reaction when you realize you dropped a ball?"
      },
      {
        id: "g5-q2",
        type: "categorization",
        title: "Scenario 2: Teammate Under Water",
        scenario: "A fellow instructor has two consecutive sessions and is struggling to set up student tablets while students are arriving. You have a free 45-minute window before your next class.",
        options: [
          { id: "OWN", text: "🟢 OWN IT" },
          { id: "SUPPORT", text: "🟡 SUPPORT IT" },
          { id: "ESCALATE", text: "🔴 ESCALATE IT" }
        ],
        correctAnswer: "SUPPORT",
        points: 1000,
        timeLimit: 25,
        explanation: "This is teamwork in action. Stepping in with available capacity ensures client satisfaction and creates a strong culture of mutual support.",
        learningObjective: "Colleague in crunch + you have capacity = SUPPORT IT.",
        discussionQuestion: "How does supporting a teammate today protect your own sessions tomorrow?"
      },
      {
        id: "g5-q3",
        type: "categorization",
        title: "Scenario 3: Scope Creep Crisis",
        scenario: "A client school principal demands that you personally rewrite the entire term curriculum and fix the school's broken printer during your teaching hours.",
        options: [
          { id: "OWN", text: "🟢 OWN IT" },
          { id: "SUPPORT", text: "🟡 SUPPORT IT" },
          { id: "ESCALATE", text: "🔴 ESCALATE IT" }
        ],
        correctAnswer: "ESCALATE",
        points: 1000,
        timeLimit: 25,
        explanation: "This request is completely outside your role, contract, and authority. Politely inform the principal: 'I will connect you with our B2B Account Manager who handles curriculum and equipment agreements.'",
        learningObjective: "Out-of-scope client demands must be escalated to Account Management, not solved unilaterally.",
        discussionQuestion: "Why should instructors never make commercial or curriculum promises directly to school principals?"
      }
    ]
  },
  {
    id: "game-6",
    title: "Game 6: Clarify Before You Commit",
    subtitle: "Ask the right questions before saying 'Yes'",
    topic: "Communication & Judgment",
    description: "Vague requests are traps. Identify which information you must extract before committing.",
    category: "Judgment",
    order: 6,
    questions: [
      {
        id: "g6-q1",
        type: "multiple-choice",
        title: "The Phantom Session",
        scenario: "Your supervisor pings you at 1:00 PM:\n'Hey! Can you prep and run tomorrow's session for the new school?'\n\nWhich combination of questions MUST you clarify before confirming your availability?",
        options: [
          { id: "A", text: "Only ask: 'How much does it pay?'" },
          { id: "B", text: "Which school? What grade & topic? What exact time & duration? Is it onsite or online? Are materials pre-made?" },
          { id: "C", text: "Say 'Yes, I'm ready!' and figure out the details 5 minutes before the session starts." },
          { id: "D", text: "Ask: 'Can someone else do it?'" }
        ],
        correctAnswer: "B",
        points: 1000,
        timeLimit: 30,
        explanation: "Never commit blindly to a 'session'. Location (traffic in Cairo/Alex!), age group, subject, and time slots determine whether you can execute successfully.",
        learningObjective: "Clarify: Grade, Topic, Time/Duration, Location (Onsite vs Online), Curriculum Assets.",
        discussionQuestion: "Have you ever agreed to a task only to discover it took 5 hours longer than you imagined?"
      }
    ]
  },
  {
    id: "game-7",
    title: "Game 7: B2B Escape Room (Team Mode)",
    subtitle: "The Ultimate 45-Minute Emergency Simulation",
    topic: "End-to-End Crisis Management",
    description: "Collaborative team challenge simulating a real live workshop emergency with progressive clues.",
    category: "Crisis Management",
    order: 7,
    questions: [
      {
        id: "g7-q1",
        type: "multiple-choice",
        title: "🚨 The 45-Minute Emergency: Clue Sequence",
        scenario: "Time is 8:15 AM. A flagship B2B partner school session begins at 9:00 AM sharp (45 mins away).\n\n• CLUE 1: The assigned instructor just called in sick with acute food poisoning.\n• CLUE 2: The class has 24 Grade 6 students expecting Robotics.\n• CLUE 3: The school lab has internet, but robotics kits are locked in a cabinet.\n• CLUE 4: You have another meeting scheduled at 10:00 AM.\n• CLUE 5: Teammate Nour is free until 11:00 AM and lives 10 mins away.\n\nWhat is your team's optimal coordinated action plan?",
        options: [
          { id: "A", text: "Cancel the school session and apologize to the principal." },
          { id: "B", text: "You take the 9:00 AM kick-off online/onsite with an unplugged/simulator activity, coordinate with Nour to take over at 9:45 AM, and alert the B2B Ops Lead to authorize key handover." },
          { id: "C", text: "Leave your 10:00 AM meeting unattended without telling anyone." },
          { id: "D", text: "Tell the sick instructor to show up anyway." }
        ],
        correctAnswer: "B",
        points: 1200,
        timeLimit: 60,
        explanation: "Outstanding leadership! You protect the student experience, mobilize available team capacity (Nour), communicate with Ops, and honor your 10:00 AM commitment.",
        learningObjective: "Triage → Mobilize Team → Protect Client Experience → Honor Commitments.",
        discussionQuestion: "How do great teams act like a relay race rather than isolated islands?"
      }
    ]
  },
  {
    id: "game-8",
    title: "Final Wrap-up: One Behavior I'll Practice",
    subtitle: "Individual commitment & reflection wall",
    topic: "Personal Accountability",
    description: "Every participant submits one personal commitment sentence that will appear live on the main facilitator screen.",
    category: "Reflection",
    order: 8,
    questions: [
      {
        id: "g8-q1",
        type: "reflection",
        title: "My B2B Commitment",
        scenario: "Reflect on today's workshop. In one clear sentence, what is ONE specific workplace behavior you will actively practice starting tomorrow?",
        options: [
          { id: "clarify", text: "I will clarify requirements before committing blindly." },
          { id: "own", text: "I will own mistakes early instead of hiding them." },
          { id: "adapt", text: "I will stay calm and have a plan B when classroom tech fails." },
          { id: "custom", text: "Type my own sentence..." }
        ],
        correctAnswer: null,
        points: 500,
        timeLimit: 90,
        explanation: "Consistency and daily intentional practice turn good intentions into professional reputation.",
        learningObjective: "Public commitment solidifies workplace behavior transformation.",
        discussionQuestion: "Who wants to share their commitment with the room and tell us why it matters to them?"
      }
    ]
  }
];
