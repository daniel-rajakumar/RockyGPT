Daniel Rajakumar

Jan 9, 2026

# RockyGPT: Your Campus Chatbot

## **Problem Statement**

College students face difficulties when they need to locate accurate information about the resources that their campus offers. The essential information about dining hours, office locations, academic policies, and student services exists across various websites and documents. This makes it hard and time-consuming for students to find answers to simple questions. Because of this, some students do not even bother to check the information because it is not intuitive enough.  

The project aims to create a chatbot platform that lets students access university information by using an easy-to-use interface that answers their typical questions.

## **Description**

This project will create RockyGPT, a web-based chatbot that helps students get answers to campus-related questions. The chatbot system enables students to enter their questions which will generate responses based on official college webpages and documents.

The chatbot will only answer questions using verified campus information and will show where the information came from (embedded link to the source). The chatbot system will display its uncertainty about answers through direct statements which will direct students toward appropriate assistance resources.

The project will be built as a Minimum Viable Product (MVP) that students can use and give feedback on during the Spring semester.

## **Objectives**

The objectives of this project:

- Build a working website that students can use to ask campus questions

- Use official campus information to generate accurate answers

- Prevent the chatbot from guessing or giving false information (Critical) 

- Allow students to give feedback on the chatbot’s answers (By having thumbs down and thumbs up buttons next to every output)

- Analyze how helpful the chatbot is based on student feedback

## **Scope**

### **Included in the MVP:**

- Questions about dining hours and locations ([LINK](https://ramapo.sodexomyway.com/en-us/locations/))

- Questions about campus offices and contact information ([LINK](https://www.ramapo.edu/campus-directory/))

- Common student questions (printing, ID cards, registration help)

- Campus locations and general policies

- A chat interface with clear answers

- A feedback system for students (A form or contact email)

### **Not included in the MVP (Future Goals):**

- Personal student data by connecting their student account (grades, schedules, financial aid)

- Live or real-time data such as daily dining menus

- Mobile application

## **Data Sources**

All data used in this project will come from **publicly available and official university sources**, such as:

- University websites

- Official PDF documents and handbooks

The information will be manually collected and stored as text files with clear source links. 

**No private or login-required systems will be accessed.**

## **Technical Approach**

The chatbot will work in the following way:

- Campus documents are collected and saved as text

- The text is broken into smaller pieces for searching (Chucks and store in vectors)

- When a student asks a question, the system finds the most relevant information (From vector databases)

- The chatbot generates an answer using only that information

- The answer includes sources or clearly states when an answer is unknown (Objective answers)

## **Technology Used**

- **Frontend:** Next.js and TypeScript

- **Backend:** Serverless API routes

- **Database:** PostgreSQL

- **AI System:** Retrieval-based chatbot using embeddings

- **Deployment:** Cloud-hosted website (A domain like squarespace) 

## **Evaluation Plan**

The chatbot will be tested by real students. Evaluation will include:

- Student feedback (helpful or not helpful)

- Review of incorrect or unclear answers

- Analysis of common questions and problem areas

This feedback will be used to improve the system and also understand what information students are looking for on daily bases. 

## **Timeline**

- Proposal approval and planning (Winter break)

- Development of the MVP chatbot (Finish by early semester)

- Student testing and feedback collection (throughout the semester)

- Improvements and analysis (throughout the semester) 

- Final report and presentation (end of the semester) 

## **Expected Outcomes**

By the end of the project, the following will be delivered:

- A working campus chatbot website

- Documentation of how the system works and the project architecture 

- Student feedback and evaluation results (Data Visualization) 

- A final capstone report and presentation and source code

## **Limitations and Future Work**

This project will focus only on common campus questions and public information. In the future, the system could be expanded to support more features, better automation, or official campus integration.

