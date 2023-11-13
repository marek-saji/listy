/**
 * @param {HTMLElement} node
 * @returns {[number, number]}
 */
function getSelectionOffsets (node)
{
    const selection = node.ownerDocument.getSelection();
    const range = selection.getRangeAt(0);
    return [range.startOffset, range.endOffset];
}

/**
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function hasSelection (node)
{
    const [start, end] = getSelectionOffsets(node);
    return start !== end;
}

/**
 * @param {HTMLElement} node
 * @returns {number}
 */
function getCursorPosition (node)
{
    const [start, end] = getSelectionOffsets(node);
    if (start !== end)
    {
        return undefined;
    }
    return start;
}

/**
 * @param {HTMLElement} node
 * @param {number} position
 * @returns {void}
 */
function setCursorPosition (node, position)
{
    let textNode = node
    if (textNode.nodeType !== Node.TEXT_NODE)
    {
        // TODO Handle other cases
        textNode = textNode.childNodes[0] || textNode;
    }

    const selection = node.ownerDocument.getSelection();
    const range = node.ownerDocument.createRange();
    const newPosition = Math.min(position, textNode.textContent.length);
    range.setStart(textNode, newPosition)
    range.setEnd(textNode, newPosition);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * @param {KeyboardEvent} event
 */
function handleItemKeyPress (event)
{
    /** @type {HTMLLIElement} */
    const item = event.target;
    if (item.tagName === 'LI')
    {
        const keyCombo = [
            event.shiftKey && 'Shift',
            event.ctrlKey && 'Ctrl',
            event.altKey && 'Alt',
            event.metaKey && 'Meta',
            event.key
        ].filter(Boolean).join('+');
        console.debug('KEY:', keyCombo);

        switch (keyCombo)
        {
            case 'ArrowUp': {
                const oldPosition = getCursorPosition(item);
                if (oldPosition != null && item.previousElementSibling)
                {
                    event.preventDefault();
                    const newItem = item.previousElementSibling;
                    setCursorPosition(newItem, oldPosition);
                }
                break;
            }
            case 'ArrowDown': {
                const oldPosition = getCursorPosition(item);
                if (oldPosition != null && item.nextElementSibling)
                {
                    event.preventDefault();
                    const newItem = item.nextElementSibling;
                    // FIXME Moving to the same position is not right.
                    //       We could get away if we used monospace
                    //       font, but with vaiable width it’s all over
                    //       the place. Ideal solution would be to
                    //       enable contentEditable on the parent, which
                    //       would also give us Ctrl+Z and Ctrl+Y, but
                    //       it comes with it’s own problems.
                    setCursorPosition(newItem, oldPosition);
                }
                break;
            }
            case 'ArrowRight': {
                const position = getCursorPosition(item);
                if (position === item.textContent.length)
                {
                    event.preventDefault();
                    item.nextElementSibling?.focus();
                }
                break;
            }
            case 'ArrowLeft': {
                const position = getCursorPosition(item);
                if (position === 0)
                {
                    event.preventDefault();
                    const newItem = item.previousElementSibling;
                    if (newItem)
                    {
                        setCursorPosition(newItem, newItem.textContent.length);
                    }
                }
                break;
            }
            case 'Ctrl+Enter':
            case 'Meta+Enter':
            case 'Shift+Enter': {
                event.preventDefault();
                item.classList.toggle('completed');
                item.nextElementSibling?.focus();
                break;
            }
            case 'Enter': {
                event.preventDefault();
                const newItem = item.ownerDocument.createElement('li');
                newItem.contentEditable = true;

                const position = getCursorPosition(item);
                const content = item.textContent;
                item.textContent = content.slice(0, position);
                newItem.textContent = content.slice(position);

                item.after(newItem);
                newItem.focus();
                break;
            }
            case 'Backspace': {
                if (item.previousElementSibling && !hasSelection(item))
                {
                    const position = getCursorPosition(item);
                    if (position === 0)
                    {
                        event.preventDefault();
                        const newItem = item.previousElementSibling;
                        const oldPosition = newItem.textContent.length;
                        newItem.textContent += item.textContent;
                        item.remove();
                        setCursorPosition(newItem, oldPosition);
                    }
                }
                break;
            }
            case 'Delete': {
                if (item.nextElementSibling && !hasSelection(item))
                {
                    const position = getCursorPosition(item);
                    if (position === item.textContent.length)
                    {
                        event.preventDefault();
                        const oldItem = item.nextElementSibling;
                        item.textContent += oldItem.textContent;
                        oldItem.remove();
                        setCursorPosition(item, position);
                    }
                }
                break;
            }
        }
    }
}

function handleAddButtonClick ()
{
    const newItem = document.createElement('li');
    newItem.contentEditable = true;
    document.querySelector('ul').append(newItem);
    newItem.focus();
}

document.querySelector('main').addEventListener('keydown', handleItemKeyPress);
document.querySelector('button').addEventListener('click', handleAddButtonClick);
