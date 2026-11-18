"use client";
type Props = {
  topic: string; grade: string; goal: string; grades: string[]; goals: string[];
  onTopicChange: (value: string) => void; onGradeChange: (value: string) => void;
  onGoalChange: (value: string) => void; onSuggestion: (topic: string, subject: string) => void;
};
export default function LessonStarter(props: Props) {
  return <div className="lesson-starter-basics">
    <label>What would you like to understand?<input name="topic" maxLength={180} value={props.topic} required minLength={3} onChange={event=>props.onTopicChange(event.target.value)} placeholder="For example, why one half equals two quarters"/></label>
    <div className="lesson-starter-pair"><label>Learner level<select name="grade" value={props.grade} onChange={event=>props.onGradeChange(event.target.value)}>{props.grades.map(item=><option key={item}>{item}</option>)}</select></label><label>Learning goal<select name="goal" value={props.goal} onChange={event=>props.onGoalChange(event.target.value)}>{props.goals.map(item=><option key={item}>{item}</option>)}</select></label></div>
    <div className="lesson-starter-suggestions" aria-label="Ideas to get started"><span>Try an idea</span>{[["Equivalent fractions","Mathematics"],["How the water cycle works","Science"],["Counting actions in a loop","Computer Science"]].map(([topic,subject])=><button type="button" key={topic} aria-pressed={props.topic===topic} onClick={()=>props.onSuggestion(topic,subject)}>{topic}</button>)}</div>
    <p className="generator-note">Use your own words. Please leave out names and other private student information.</p>
  </div>;
}
