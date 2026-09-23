const fs = require('fs');
const path = require('path');

function fixJson(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const data = JSON.parse(content);
  const g4 = data.find(g => g.id === 'game-4');
  if (g4) {
    g4.questions = g4.questions.filter(q => !q.id.startsWith('g4-q4') && !q.id.startsWith('g4-q5'));
    g4.questions.push(
      {
        id: 'g4-q4',
        type: 'slack-scenario',
        title: 'Slack Case #1: The Professional Update',
        scenario: 'Mentor: Hey Ahmed, just checking — are you ready for the 11:00 AM session?\n\nTutor: Hi, yes. I noticed that I have an issue with one part of the session material. I\'ve checked what I can, but I may need clarification on the activity before the session.\n\nMentor: Okay. What exactly do you need?\n\nTutor: I need confirmation about which activity version we should use. If you can confirm that, I\'ll finish preparing it before the session.',
        options: [
          { id: 'A', text: 'Professional (Clear, asks for specific help, takes ownership)' },
          { id: 'B', text: 'Unprofessional (Should have figured it out alone)' },
          { id: 'C', text: 'Unprofessional (Too demanding of the mentor)' }
        ],
        correctAnswer: 'A',
        points: 1000,
        timeLimit: 30,
        explanation: 'This is excellent communication. The tutor communicates early, provides context, explains the issue, asks for specific clarification, and takes ownership of finishing the prep.',
        learningObjective: 'Clear communication, providing context, asking for specific clarification, and communicating early.',
        discussionQuestion: 'Why is it better to ask for clarification early rather than guessing or waiting until the session?'
      },
      {
        id: 'g4-q5',
        type: 'slack-scenario',
        title: 'Slack Case #2: The Unprofessional Exchange',
        scenario: 'Mentor: Hey Ahmed, can you confirm if you\'re able to cover tomorrow\'s session?\n\nTutor: yeah\n\nMentor: Great. The session starts at 9:00 AM.\n\nTutor: wait what session?\n\nMentor: The Grade 5 session we discussed.\n\nTutor: oh I didn\'t know about that\n\nMentor: Can you check the materials and let me know if you need anything?\n\nTutor: Can\'t. I\'m busy.',
        options: [
          { id: 'A', text: 'Professional (Sets firm boundaries)' },
          { id: 'B', text: 'Unprofessional (Delayed, unclear, fails to assess task before committing)' },
          { id: 'C', text: 'Neutral (Just a normal quick chat)' }
        ],
        correctAnswer: 'B',
        points: 1000,
        timeLimit: 30,
        explanation: 'The tutor committed without knowing what the task was, gave delayed and unhelpful responses, and ultimately rejected the task unprofessionally after causing confusion.',
        learningObjective: 'Assess tasks before committing, maintain professionalism, and communicate limitations early and clearly.',
        discussionQuestion: 'How could the tutor have established boundaries professionally in this situation?'
      }
    );
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  }
}

fixJson(path.join(__dirname, 'server/data/games.json'));
