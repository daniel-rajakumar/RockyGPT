import { openaiClient } from '../src/lib/ai/embedding';
import { searchDocuments } from '../src/lib/ai/retrieval';

interface TestQuestion {
  question: string;
  category: string;
  expectedKeywords: string[];
}

const testQuestions: TestQuestion[] = [
  {
    question: "What are dining hours?",
    category: "Dining",
    expectedKeywords: ["Birch", "hours", "Monday", "Friday"]
  },
  {
    question: "When is Spring Break?",
    category: "Academic Calendar",
    expectedKeywords: ["Spring Break", "March", "2026"]
  },
  {
    question: "How much is tuition for in-state students?",
    category: "Tuition",
    expectedKeywords: ["tuition", "state", "credit"]
  },
  {
    question: "How much does parking cost?",
    category: "Parking",
    expectedKeywords: ["parking", "permit", "cost", "$"]
  },
  {
    question: "When does the library close?",
    category: "Campus Hours",
    expectedKeywords: ["library", "Potter", "close", "hours"]
  },
  {
    question: "How do I change my major?",
    category: "Procedures",
    expectedKeywords: ["major", "advisor", "form", "Academic Advising"]
  },
  {
    question: "How do I connect to WiFi?",
    category: "Technology",
    expectedKeywords: ["WiFi", "network", "RCNJ", "connect"]
  },
  {
    question: "What's the registrar phone number?",
    category: "Contact",
    expectedKeywords: ["registrar", "phone", "201", "684"]
  },
  {
    question: "What events are happening Friday?",
    category: "Events",
    expectedKeywords: ["Friday", "event", "2026"]
  },
  {
    question: "Where is the gym?",
    category: "Buildings",
    expectedKeywords: ["Bradley", "Center", "gym", "fitness"]
  }
];

async function testChatbot() {
  console.log('🤖 RockyGPT Accuracy Test Report');
  console.log('='.repeat(80));
  console.log(`\nTesting ${testQuestions.length} questions...\n`);

  const results: any[] = [];

  for (let i = 0; i < testQuestions.length; i++) {
    const test = testQuestions[i];
    console.log(`\n[${i + 1}/${testQuestions.length}] ${test.category}: "${test.question}"`);
    console.log('-'.repeat(80));

    try {
      // Retrieve relevant documents
      const docs = await searchDocuments(test.question, 30);
      
      if (docs.length === 0) {
        console.log('❌ NO DATA RETRIEVED');
        results.push({
          ...test,
          status: 'FAILED',
          reason: 'No relevant documents found',
          docsRetrieved: 0
        });
        continue;
      }

      // Check if expected keywords are in retrieved docs
      const allContent = docs.map(d => d.content).join(' ').toLowerCase();
      const foundKeywords = test.expectedKeywords.filter(kw => 
        allContent.includes(kw.toLowerCase())
      );
      const accuracy = (foundKeywords.length / test.expectedKeywords.length) * 100;

      console.log(`📊 Retrieved ${docs.length} document chunks`);
      console.log(`🔍 Expected keywords: ${test.expectedKeywords.join(', ')}`);
      console.log(`✓ Found keywords: ${foundKeywords.join(', ')}`);
      console.log(`📈 Keyword match: ${foundKeywords.length}/${test.expectedKeywords.length} (${accuracy.toFixed(0)}%)`);
      
      // Show snippet of top result
      console.log(`\n📄 Top result snippet:`);
      console.log(`   Source: ${docs[0].metadata.source}`);
      console.log(`   Content: ${docs[0].content.substring(0, 150)}...`);

      const status = accuracy >= 75 ? '✅ PASS' : accuracy >= 50 ? '⚠️  PARTIAL' : '❌ FAIL';
      console.log(`\n${status}`);

      results.push({
        ...test,
        status: accuracy >= 75 ? 'PASS' : accuracy >= 50 ? 'PARTIAL' : 'FAIL',
        accuracy,
        docsRetrieved: docs.length,
        foundKeywords,
        topSource: docs[0].metadata.source
      });

    } catch (error) {
      console.log('❌ ERROR:', error);
      results.push({
        ...test,
        status: 'ERROR',
        error: String(error),
        docsRetrieved: 0
      });
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR' || r.status === 'FAILED').length;
  
  console.log(`\n✅ PASSED:  ${passed}/${testQuestions.length} (${((passed/testQuestions.length)*100).toFixed(0)}%)`);
  console.log(`⚠️  PARTIAL: ${partial}/${testQuestions.length} (${((partial/testQuestions.length)*100).toFixed(0)}%)`);
  console.log(`❌ FAILED:  ${failed}/${testQuestions.length} (${((failed/testQuestions.length)*100).toFixed(0)}%)`);
  
  console.log('\n\n📋 DETAILED BREAKDOWN:');
  results.forEach((r, i) => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${i + 1}. ${icon} [${r.category}] ${r.question}`);
    console.log(`   Status: ${r.status} | Accuracy: ${r.accuracy?.toFixed(0) || 'N/A'}% | Docs: ${r.docsRetrieved}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Overall Score: ${((passed + partial * 0.5) / testQuestions.length * 100).toFixed(0)}%`);
  console.log('='.repeat(80));

  process.exit(0);
}

testChatbot();
