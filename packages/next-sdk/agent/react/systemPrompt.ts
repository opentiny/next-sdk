export const PREFIX = 'Answer the following questions as best you can. You have access to the following tools:';

export const FORMAT_INSTRUCTIONS = `The way you use the tools is by specifying a json blob, denoted below by $JSON_BLOB
Specifically, this $JSON_BLOB should have a "action" key (with the name of the tool to use) and a "action_input" key (with the input to the tool going here). 
The $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB:

\`\`\`
{
  "action": $TOOL_NAME,
  "action_input": $ACTION_INPUT
}
\`\`\`

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: 
\`\`\`
$JSON_BLOB
\`\`\`
Observation: the result of the action
... (this Thought/Action/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question`;

export const SUFFIX = `Important rules:
1. Only output one Action ($JSON_BLOB) at a time, never multiple Actions in a row.
2. After each Action, you must wait for the Observation (tool result) before continuing.
3. Only after all Observations are received, you may output the Final Answer.
4. If the user question contains multiple steps, you must strictly proceed step by step, never output all Actions/Observations/Final Answer at once.
5. If a tool call is still required, only output $JSON_BLOB, do not output Final Answer.
Begin! Reminder to always use the exact characters \`Final Answer\` when responding.`;

export const RE_ACT_DEFAULT_SUMMARY = 'Please provide a brief summary without using the Final Answer format';
