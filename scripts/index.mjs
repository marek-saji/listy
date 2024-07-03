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
        // TODO Better handle setting position in nodes with more than just one text node
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
 * @param {HTMLElement} node
 * @returns {void}
 */
function selectAll (node)
{
    let textNode = node
    if (textNode.nodeType !== Node.TEXT_NODE)
    {
        // TODO Better handle getting position from nodes with more than just one text node
        textNode = textNode.childNodes[0] || textNode;
    }

    const selection = node.ownerDocument.getSelection();
    const range = node.ownerDocument.createRange();
    range.setStart(textNode, 0)
    range.setEnd(textNode, textNode.textContent.length);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * @param {KeyboardEvent} event
 * @returns {string}
 */
function getKeyboardEventKeyCombo (event)
{
    return [
        event.ctrlKey && 'Ctrl',
        event.altKey && 'Alt',
        event.shiftKey && 'Shift',
        event.metaKey && 'Meta',
        event.key
    ].filter(Boolean).join('+');
}

/**
 * @param {KeyboardEvent} event
 */
function handleItemKeyDown (event)
{
    /** @type {HTMLLIElement} */
    const item = event.target;
    if (item.tagName === 'LI')
    {
        const keyCombo = getKeyboardEventKeyCombo(event);
        console.debug('KEY:', keyCombo);

        switch (keyCombo)
        {
            case 'ArrowUp': {
                const oldPosition = getCursorPosition(item);
                // FIXME Don’t do anything, if cursor is not in the first line of a multi–line item.
                if (oldPosition != null && item.previousElementSibling)
                {
                    event.preventDefault();
                    const newItem = item.previousElementSibling;
                    // FIXME Moving to the same text offset when switching between items is not great UX.
                    //       We could get away if we used monospace
                    //       font, but with vaiable width it’s all over
                    //       the place.
                    setCursorPosition(newItem, oldPosition);
                }
                break;
            }

            case 'ArrowDown': {
                const oldPosition = getCursorPosition(item);
                // FIXME Don’t do anything, if cursor is not in the last line of a multi–line item.
                if (oldPosition != null && item.nextElementSibling)
                {
                    event.preventDefault();
                    const newItem = item.nextElementSibling;
                    // FIXME Moving to the same text offset when switching between items is not great UX.
                    //       We could get away if we used monospace
                    //       font, but with vaiable width it’s all over
                    //       the place.
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

                const position = getCursorPosition(item);
                selectAll(item);
                document.execCommand('strikeThrough');
                item.innerHTML = item.textContent;
                setCursorPosition(item, position);

                item.classList.toggle('completed');
                if (item.classList.contains('completed'))
                {
                    if (item.nextElementSibling)
                    {
                        item.nextElementSibling.focus();
                    }
                }
                break;
            }

            case 'Enter': {
                event.preventDefault();
                const newItem = item.ownerDocument.createElement('li');
                newItem.contentEditable = true;

                const position = getCursorPosition(item);
                const content = item.textContent;

                if (position === 0)
                {
                    newItem.textContent = content.slice(0, position);
                    item.textContent = content.slice(position);
                    item.before(newItem);
                }
                else
                {
                    item.textContent = content.slice(0, position);
                    newItem.textContent = content.slice(position);
                    item.after(newItem);
                    newItem.focus();
                }
                break;
            }

            case 'Backspace': {
                if (item.previousElementSibling && !hasSelection(item))
                {
                    const position = getCursorPosition(item);
                    if (position === 0)
                    {
                        event.preventDefault();
                        if (item.previousElementSibling.textContent === '')
                        {
                            item.previousElementSibling.remove();
                        }
                        else
                        {
                            const newItem = item.previousElementSibling;
                            const oldPosition = newItem.textContent.length;
                            newItem.textContent += item.textContent;
                            item.remove();
                            setCursorPosition(newItem, oldPosition);
                        }
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

        // Ensure no formatting went through by pasting or using keyboard shortcuts
        // TODO Throttle
        requestAnimationFrame(() => {
            if (item.innerHTML !== item.textContent)
            {
                item.innerHTML = item.textContent;
            }
        });
    }
}

/**
 * @param {KeyboardEvent} event
 */
function handleItemKeyUp (event)
{
    /** @type {HTMLLIElement} */
    const item = event.target;
    if (item.tagName === 'LI')
    {
        const keyCombo = getKeyboardEventKeyCombo(event);
        console.debug('KEY:', keyCombo);

        let undoHistoryChange = false;

        switch (keyCombo)
        {
            // QUIRK
            // Would be nice to handle these in handleItemKeyDown with
            // the rest, but WebKit doesn’t send Undo/Redo keyboard
            // events in keydown (but does in keyup).
            case 'Ctrl+z':
            case 'Meta+z':
            case 'Ctrl+Shift+z':
            case 'Meta+Shift+z': {
                undoHistoryChange = true;
                break;
            }
        }

        if (undoHistoryChange)
        {
            // QUIRK
            // Because of formatting cleanup after an Undo or Redo, we
            // can end up with two text nodes (with equal content) in
            // the same item.
            // TODO Throttle
            requestAnimationFrame(() => {
                if (
                    item.childNodes.length === 2
                    && item.childNodes[0].textContent === item.childNodes[1].textContent
                )
                {
                    item.childNodes[1].remove();
                }
            });
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

document.querySelector('main').addEventListener('keydown', handleItemKeyDown);
document.querySelector('main').addEventListener('keyup', handleItemKeyUp);
document.querySelector('button').addEventListener('click', handleAddButtonClick);
