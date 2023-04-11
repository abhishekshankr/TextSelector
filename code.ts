figma.showUI(__html__, { width: 282, height: 250 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'select-layers') {
    const selectionCriteria = msg.selectionCriteria;
    const includePunctuation = msg.includePunctuation;

    let nodesToProcess = figma.currentPage.selection;

    if (figma.currentPage.selection.length === 0) {
      nodesToProcess = figma.currentPage.children;
    }

    const textNodes = await findTextNodes(nodesToProcess);

    const filteredTextNodes = textNodes.filter((node) =>
      shouldSelectNode(node, selectionCriteria, includePunctuation),
    );

    if (filteredTextNodes.length === 0) {
      figma.notify('No layers found that match the selection criteria.');
      return;
    }

    figma.currentPage.selection = filteredTextNodes;
    figma.closePlugin();
    figma.notify('Selected layers based on criteria');
  }
};

async function findTextNodes(nodes: ReadonlyArray<BaseNode>): Promise<TextNode[]> {
  let textNodes: TextNode[] = [];

  for (const node of nodes) {
    if ('children' in node) {
      textNodes = textNodes.concat(await findTextNodes(node.children));
    } else if (node.type === 'TEXT') {
      textNodes.push(node);
    }
  }

  return textNodes;
}

function shouldSelectNode(node: TextNode, selectionCriteria: string, includePunctuation: boolean): boolean {
  const regexes: { [key: string]: RegExp } = {
    text: /[a-zA-Z]+/,
    numbers: /\d+/,
    specialCharacters: includePunctuation
      ? /[^a-zA-Z0-9\s]/ // Include all non-word characters and non-whitespace characters
      : /[^a-zA-Z0-9\s.,?!]+/, // Exclude word characters, whitespace, and specified punctuation characters
  };

  const regex = regexes[selectionCriteria];
  return regex.test(node.characters);
}
