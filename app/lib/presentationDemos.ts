export type DemoId = "math" | "science" | "coding";
export type DemoQuestion = { question: string; options: string[]; answerIndex: number; hint: string; explanation: string };
export type PresentationDemo = {
  id: DemoId; subject: string; title: string; level: string; topic: string;
  scenes: Array<{ title: string; narration: string }>;
  practice: DemoQuestion; transfer: DemoQuestion;
};
export const presentationDemos: PresentationDemo[] = [
  {
    id: "math", subject: "Math", title: "Same whole. Different shares.", level: "Grades 3-5", topic: "Equivalent fractions: two quarters equal one half",
    scenes: [
      { title: "Start with the same whole", narration: "These two bars are the same size. Each bar represents one whole. To compare fractions fairly, keep the size of the whole the same." },
      { title: "Take one of two equal parts", narration: "Split the top bar into two equal parts. One selected part is one half. The selected area covers half of the whole bar." },
      { title: "Two quarters cover the same amount", narration: "Split the bottom bar into four equal parts. Two quarters cover exactly the same amount as one half. The number of pieces changes, but the selected amount stays the same." }
    ],
    practice: { question: "How many equal quarters make one whole?", options: ["2 quarters", "4 quarters", "8 quarters"], answerIndex: 1, hint: "A quarter is one of four equal parts. Count how many of those parts fill the whole.", explanation: "Four quarters fill one whole: 4/4 = 1." },
    transfer: { question: "A same-sized whole is split into six equal parts. How many sixths cover one half?", options: ["2 sixths", "3 sixths", "6 sixths"], answerIndex: 1, hint: "Split the six equal parts into two equal groups. How many parts are in one group?", explanation: "Three of the six equal parts cover half the whole: 3/6 = 1/2." }
  },
  {
    id: "science", subject: "Science", title: "Follow a drop of water.", level: "Grades 3-5", topic: "Evaporation, condensation, and precipitation in the water cycle",
    scenes: [
      { title: "Liquid water becomes water vapor", narration: "Energy from sunlight warms water. Some liquid water changes into water vapor, a gas that mixes with the air. This change from liquid to gas is evaporation. Water vapor itself is invisible." },
      { title: "Cooling forms tiny droplets", narration: "When water vapor cools enough, it changes into tiny liquid droplets. This is condensation. Clouds contain tiny water droplets or ice crystals; they are not made of water vapor alone." },
      { title: "Water returns as rain", narration: "Cloud droplets can combine and grow. When drops are large enough, they fall as rain. This is one form of precipitation. Water collects on the ground and can evaporate again." }
    ],
    practice: { question: "Water vapor cools and changes into tiny liquid droplets. What is this process?", options: ["Evaporation", "Condensation", "Precipitation"], answerIndex: 1, hint: "Look for the name of the change from gas to liquid, rather than liquid to gas or falling water.", explanation: "Condensation changes water vapor into liquid droplets." },
    transfer: { question: "A puddle gets smaller on a warm day without flowing away. Which process best explains this?", options: ["Evaporation", "Condensation", "Precipitation"], answerIndex: 0, hint: "Think about liquid water gaining energy and changing into a gas.", explanation: "Some liquid water evaporates into the air as water vapor." }
  },
  {
    id: "coding", subject: "Coding", title: "One instruction. Repeat it.", level: "Grades 3-5", topic: "Counting repeated actions with a simple loop",
    scenes: [
      { title: "Describe one action", narration: "Our robot can move one square to the right. That is one action. The code shown here is pseudocode: a simple way to describe instructions without choosing a programming language." },
      { title: "Repeat the action three times", narration: "A repeat loop runs the same instruction a chosen number of times. Repeat three times means move one square, then one square again, then one square once more." },
      { title: "Count all the moves", narration: "Three repeats of one square make three squares in total. To predict a loop, check both the number of repeats and what happens during each repeat. The loop does not change the instruction by itself." }
    ],
    practice: { question: "Repeat 4 times: move 2 squares. How many squares does the robot move in total?", options: ["4 squares", "6 squares", "8 squares"], answerIndex: 2, hint: "Add two squares for each of the four repeats: 2 + 2 + 2 + 2.", explanation: "Four repeats of two squares make eight squares: 4 × 2 = 8." },
    transfer: { question: "Repeat 3 times: move 3 squares. What is the total distance?", options: ["3 squares", "6 squares", "9 squares"], answerIndex: 2, hint: "There are three repeats, and each adds three squares.", explanation: "Three repeats of three squares make nine squares: 3 × 3 = 9." }
  }
];
export function findPresentationDemo(id: string | null) {
  return presentationDemos.find(demo => demo.id === id) || presentationDemos[0];
}
