"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { demoSessionOptions } from "../curriculum-demo/demo-session-data";

function uniqueValues(key: "grade" | "subject") {
  return Array.from(new Set(demoSessionOptions.map((option) => option[key])));
}

export default function CurriculumDemoGenerator() {
  const grades = uniqueValues("grade");
  const subjects = uniqueValues("subject");
  const [grade, setGrade] = useState(grades[0]);
  const [subject, setSubject] = useState(subjects[0]);
  const availableTopics = useMemo(
    () => demoSessionOptions.filter((option) => option.grade === grade && option.subject === subject),
    [grade, subject]
  );
  const fallbackTopics = useMemo(
    () => demoSessionOptions.filter((option) => option.grade === grade || option.subject === subject),
    [grade, subject]
  );
  const topicOptions = availableTopics.length ? availableTopics : fallbackTopics;
  const [topic, setTopic] = useState(demoSessionOptions[0].topic);

  const selectedPlan =
    demoSessionOptions.find(
      (option) => option.grade === grade && option.subject === subject && option.topic === topic
    ) ??
    topicOptions[0] ??
    demoSessionOptions[0];

  function updateGrade(event: ChangeEvent<HTMLSelectElement>) {
    const nextGrade = event.target.value;
    const nextPlan =
      demoSessionOptions.find((option) => option.grade === nextGrade && option.subject === subject) ??
      demoSessionOptions.find((option) => option.grade === nextGrade) ??
      demoSessionOptions[0];
    setGrade(nextGrade);
    setSubject(nextPlan.subject);
    setTopic(nextPlan.topic);
  }

  function updateSubject(event: ChangeEvent<HTMLSelectElement>) {
    const nextSubject = event.target.value;
    const nextPlan =
      demoSessionOptions.find((option) => option.grade === grade && option.subject === nextSubject) ??
      demoSessionOptions.find((option) => option.subject === nextSubject) ??
      demoSessionOptions[0];
    setGrade(nextPlan.grade);
    setSubject(nextSubject);
    setTopic(nextPlan.topic);
  }

  function updateTopic(event: ChangeEvent<HTMLSelectElement>) {
    setTopic(event.target.value);
  }

  return (
    <section className="section demo-generator-section" id="demo-generator">
      <div className="section-heading">
        <p className="eyebrow">Demo Session Generator</p>
        <h2>See how an experienced tutor would structure the first 30 minutes.</h2>
        <p>
          Parents choose a grade, subject, and topic. NovaSprout shows a sample plan with the flow a
          tutor can adapt during the live demo.
        </p>
      </div>

      <div className="demo-generator">
        <div className="generator-controls" aria-label="Choose a demo session">
          <label>
            Grade or level
            <select onChange={updateGrade} value={grade}>
              {grades.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <select onChange={updateSubject} value={subject}>
              {subjects.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Topic
            <select onChange={updateTopic} value={selectedPlan.topic}>
              {topicOptions.map((item) => (
                <option key={`${item.grade}-${item.subject}-${item.topic}`} value={item.topic}>
                  {item.topic}
                </option>
              ))}
            </select>
          </label>
        </div>

        <article className="generated-lesson">
          <p className="mini-label">
            {selectedPlan.grade} · {selectedPlan.subject}
          </p>
          <h3>{selectedPlan.topic}</h3>
          <p>{selectedPlan.tutorLens}</p>
          <div className="lesson-timeline">
            <div>
              <span>0-5 min</span>
              <strong>Warm-up</strong>
              <p>{selectedPlan.lesson.warmUp}</p>
            </div>
            <div>
              <span>5-12 min</span>
              <strong>Concept explanation</strong>
              <p>{selectedPlan.lesson.conceptExplanation}</p>
            </div>
            <div>
              <span>12-18 min</span>
              <strong>Guided example</strong>
              <p>{selectedPlan.lesson.guidedExample}</p>
            </div>
            <div>
              <span>18-25 min</span>
              <strong>Practice questions</strong>
              <ul>
                {selectedPlan.lesson.practiceQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
            <div>
              <span>25-28 min</span>
              <strong>Quick assessment</strong>
              <p>{selectedPlan.lesson.quickAssessment}</p>
            </div>
            <div>
              <span>28-30 min</span>
              <strong>Recommended next session</strong>
              <p>{selectedPlan.lesson.nextSession}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
