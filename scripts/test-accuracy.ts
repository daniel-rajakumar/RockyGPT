import fs from 'fs';
import path from 'path';

interface TestQuestion {
  question: string;
  category: string;
  expectedKeywords: string[];
}

const testQuestions: TestQuestion[] = [
  // --- DINING (Critical for students) ---
  { question: "Is Dunkin open right now?", category: "Dining", expectedKeywords: ["Dunkin", "hours", "AM", "PM"] },
  { question: "What vegan food do you have?", category: "Dining", expectedKeywords: ["Vegan", "Vegetarian", "salad", "plant"] },
  { question: "How much is a meal plan?", category: "Dining", expectedKeywords: ["meal plan", "cost", "semester", "$"] },
  { question: "Where is the dining hall?", category: "Dining", expectedKeywords: ["Atrium", "Student Center", "Birch"] },
  
  // --- SOCIAL & EVENTS ---
  { question: "Any fun events this weekend?", category: "Events", expectedKeywords: ["Friday", "Saturday", "Sunday", "event"] },
  { question: "When is the next basketball game?", category: "Events", expectedKeywords: ["Basketball", "Bradley", "vs"] },
  { question: "How do I join a club?", category: "Student Life", expectedKeywords: ["Archway", "student organizations", "join"] },
  
  // --- ACADEMIC STRESS ---
  { question: "How do I withdraw from a class?", category: "Academics", expectedKeywords: ["withdraw", "deadline", "form", "registrar"] },
  { question: "When are finals?", category: "Academics", expectedKeywords: ["final", "exam", "May", "December"] },
  { question: "I need a tutor.", category: "Academics", expectedKeywords: ["Center for Student Success", "tutoring", "appointment"] },
  { question: "Where is the library?", category: "Academics", expectedKeywords: ["Potter", "Library", "location"] },
  
  // --- MONEY ---
  { question: "When is tuition due?", category: "Financial", expectedKeywords: ["payment", "due", "deadline"] },
  { question: "How do I apply for financial aid?", category: "Financial", expectedKeywords: ["FAFSA", "financial aid", "deadline"] },
  { question: "Are there work study jobs?", category: "Financial", expectedKeywords: ["handshake", "work study", "job"] },
  
  // --- DORM LIFE ---
  { question: "I got locked out of my room.", category: "Housing", expectedKeywords: ["Public Safety", "RA", "office", "ID"] },
  { question: "Can I have a guest overnight?", category: "Housing", expectedKeywords: ["guest", "policy", "sign in", "overnight"] },
  { question: "How much is laundry?", category: "Housing", expectedKeywords: ["laundry", "free", "included"] },
  
  // --- TECH & SERVICES ---
  { question: "Wifi is not working.", category: "Tech", expectedKeywords: ["ITS", "Help Desk", "Ramapo-Secure"] },
  { question: "How do I print a paper?", category: "Tech", expectedKeywords: ["printer", "lab", "print"] },
  { question: "Where is the gym?", category: "Health", expectedKeywords: ["Bradley", "Center", "fitness"] },
  { question: "I'm sick, where do I go?", category: "Health", expectedKeywords: ["Health Services", "nurse", "appointment"] },
  { question: "I feel really stressed/depressed.", category: "Health", expectedKeywords: ["Counseling", "mental health", "wellness"] },
  
  // --- TRANSPORT & SAFETY ---
  { question: "Is there a shuttle to the train?", category: "Transport", expectedKeywords: ["shuttle", "Ramsey", "Route 17", "schedule"] },
  { question: "How do I appeal a parking ticket?", category: "Transport", expectedKeywords: ["appeal", "public safety", "form"] },
  { question: "I lost my ID card.", category: "Safety", expectedKeywords: ["Public Safety", "ID", "replace"] }
];

async function queryChatbot(question: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: question }] })
    });
    return response.ok ? await response.text() : `Error: ${response.statusText}`;
  } catch (error) {
    return `Error: ${String(error)}`;
  }
}

// Judge the answer from a "Student POV"
function evaluateStudentPOV(answer: string, expectedKeywords: string[]) {
  const lowerAnswer = answer.toLowerCase();
  
  // 1. Accuracy Check (Keyword match)
  const foundKeywords = expectedKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase()));
  const accuracyScore = (foundKeywords.length / expectedKeywords.length) * 100;
  
  // 2. "Actionability" (Does it help me DO something?)
  const hasLink = /http|www\.|\.edu/.test(answer);
  const hasPhone = /\d{3}[-.]\d{3}[-.]\d{4}/.test(answer);
  const hasLocation = /(Room|Wing|Center|Hall|Office)/i.test(answer);
  const hasSteps = /(1\.|Step|First|Then)/i.test(answer);
  
  let utilityScore = 0;
  if (hasLink) utilityScore += 25;
  if (hasPhone) utilityScore += 25;
  if (hasLocation) utilityScore += 25;
  if (hasSteps) utilityScore += 25;
  
  // Bonus readability (Markdown usage)
  if (answer.includes('**') || answer.includes('- ')) utilityScore += 10;
  if (utilityScore > 100) utilityScore = 100;

  // Final subjective grade
  let grade = 'F';
  if (accuracyScore > 70 && utilityScore > 50) grade = 'A';
  else if (accuracyScore > 50 && utilityScore > 30) grade = 'B';
  else if (accuracyScore > 20) grade = 'C';
  
  return { accuracyScore, utilityScore, grade, foundKeywords };
}

async function runTest() {
  console.log('🚀 Starting 25-Question Student POV Test...');
  
  let markdownOutput = `# 🎓 RockyGPT Student POV Test Report

*Generated: ${new Date().toLocaleString()}*

## 🏫 Test Criteria (Student Perspective)
We graded each answer on two metrics:
1. **Accuracy:** Did it find the right facts?
2. **Utility:** Was it actually helpful? (Links, Phone #s, Locations, Steps)

| ID | Category | Question | Grade | Accuracy | Utility | Result |
|----|----------|----------|-------|----------|---------|--------|
`;

  const results = [];

  for (let i = 0; i < testQuestions.length; i++) {
    const test = testQuestions[i];
    console.log(`[${i+1}/25] Testing: ${test.question}...`);
    
    const answer = await queryChatbot(test.question);
    const metrics = evaluateStudentPOV(answer, test.expectedKeywords);
    
    const statusIcon = metrics.grade === 'A' || metrics.grade === 'B' ? '✅' : metrics.grade === 'C' ? '⚠️' : '❌';
    const safeAnswer = answer.replace(/\|/g, '\\|').replace(/\n/g, '<br>');

    // Truncate answer for summary table
    const summaryAnswer = safeAnswer.substring(0, 100) + '...';

    markdownOutput += `| ${i+1} | ${test.category} | ${test.question} | **${metrics.grade}** | ${metrics.accuracyScore.toFixed(0)}% | ${metrics.utilityScore}% | ${statusIcon} |\n`;
    
    results.push({ ...test, answer, ...metrics });
  }

  // Stats
  const gradeA = results.filter(r => r.grade === 'A').length;
  const gradeB = results.filter(r => r.grade === 'B').length;
  const gradeC = results.filter(r => r.grade === 'C').length;
  const gradeF = results.filter(r => r.grade === 'F').length;
  
  markdownOutput += `
<br>

## 📊 Report Card
- **A (Excellent):** ${gradeA}
- **B (Good):** ${gradeB}
- **C (Okay):** ${gradeC}
- **F (Fail):** ${gradeF}
- **GPA:** ${((gradeA*4 + gradeB*3 + gradeC*2)/25).toFixed(2)} / 4.0

<br>

## 📝 Full Responses (Student POV Analysis)

`;

  results.forEach((r, i) => {
    markdownOutput += `### ${i+1}. ${r.question}
**Grade:** ${r.grade} | **Accuracy:** ${r.accuracyScore.toFixed(0)}% | **Utility:** ${r.utilityScore}%
> **Student Verdict:** ${r.grade === 'A' ? "Super helpful! 🌟" : r.grade === 'B' ? "Good info. 👍" : "Could be better. 🤔"}

${r.answer}

---\n\n`;
  });

  const outputPath = path.join(process.cwd(), 'student_pov_report.md');
  fs.writeFileSync(outputPath, markdownOutput);
  
  console.log(`\n✅ Test complete! Saved to: ${outputPath}`);
}

runTest();
