function parseQA(fieldsetNode, cssMap, style) {
  const questions = [];
  const children = fieldsetNode.childNodes || [];

  let i = 0;
  let blankCounter = 1;

  while (i < children.length) {
    const node = children[i];

    // -----------------------------
    // DIVIDER (HR)
    // -----------------------------
    if (node.tagName === "HR") {
      questions.push({ type: "divider" });
      i++;
      continue;
    }

    // -----------------------------
    // MCQ
    // -----------------------------
    if (node.tagName === "DIV" && hasRadioInputs(node)) {
      const questionText =
        node.querySelector("div")?.text?.trim() ?? "";

      const labels = node.querySelectorAll("label") || [];
      const answerText =
        node.querySelector(".qa-answer span")?.text?.trim() ?? "";

      const options = labels.map((label, idx) => {
        const text = label.text.trim();
        return {
          id: String.fromCharCode(97 + idx),
          text,
          isCorrect: text === answerText,
        };
      });

      questions.push({
        questionType: "mcq",
        question: questionText,
        options,
        answer: options.find(o => o.isCorrect)?.id ?? null,
      });

      i++;
      continue;
    }

    // -----------------------------
    // FILL IN THE BLANK (FIXED)
    // -----------------------------
    if (node.tagName === "DIV" && node.querySelector("input[type='text']")) {
      const segments = [];
      let textBuffer = "";

      node.childNodes.forEach(child => {
        // TEXT NODE
        if (child.nodeType === 3) {
          textBuffer += child.text;
        }

        // INPUT = BLANK
        if (child.tagName === "INPUT") {
          if (textBuffer.trim()) {
            segments.push({
              type: "text",
              value: textBuffer,
            });
          }

          segments.push({
            type: "blank",
            id: `b${blankCounter++}`,
          });

          textBuffer = "";
        }
      });

      // trailing text
      if (textBuffer.trim()) {
        segments.push({
          type: "text",
          value: textBuffer,
        });
      }

      // Answer is in the NEXT qa-answer block
      const answerNode = children[i + 1];
      const answerText =
        answerNode?.querySelector?.(".qa-answer span")?.text?.trim() ??
        answerNode?.querySelector?.("span")?.text?.trim() ??
        "";

      questions.push({
        questionType: "fill",
        segments,
        answer: answerText,
      });

      i += 2; // skip answer block
      continue;
    }

    i++;
  }

  return {
    type: "qa",
    style,
    data: {
      questions,
    },
    children: [],
  };
}

// -----------------------------
// HELPERS
// -----------------------------
function hasRadioInputs(node) {
  return (node.querySelectorAll("input[type='radio']") || []).length > 0;
}

export { parseQA };
