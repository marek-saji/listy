/**
 * @param {HTMLUListElement} list
 */
function cleanUpList (list)
{
    Array.from(list.children).forEach((item) => {
        if (item.tagName === 'LI')
        {
            if (Array.from(item.childNodes).some(node => node.nodeType !== Node.TEXT_NODE))
            {
                item.textContent = item.textContent;
                item.removeAttribute('style');
                // TODO Clean up other stuff?
            }
        }
        else if (item.tagName === 'UL')
        {
            cleanUpList(item);
        }
    });
}

/**
 * @param {MouseEvent} event
 */
function handleAddButtonClick ()
{
    const list = document.querySelector('ul')
    const newItem = list.ownerDocument.createElement('li');
    list.append(newItem);
    const selection = list.ownerDocument.getSelection();
    const range = list.ownerDocument.createRange();
    range.setStart(newItem, 0);
    range.setEnd(newItem, 0);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * @param {KeyboardEvent} event
 */
function handleListKeydown (event)
{
    /** @type {HTMLUListElement} */
    const list = event.target;
    cleanUpList(list);
}

/**
 * @param {KeyboardEvent} event
 */
function handleListKeyup (event)
{
    /** @type {HTMLUListElement} */
    const list = event.target;

    const keyCombo = [
        event.ctrlKey && 'Ctrl',
        event.shiftKey && 'Shift',
        event.altKey && 'Alt',
        event.metaKey && 'Meta',
        event.key,
    ].filter(Boolean).join('+');
    console.debug('KEY', keyCombo);

    switch (keyCombo)
    {
        case 'Ctrl+Enter':
        case 'Shift+Enter':
        case 'Meta+Enter':
        {
            event.preventDefault();
            const selection = list.ownerDocument.getSelection();
            const focusNode = selection.focusNode;
            const item = focusNode.nodeType === Node.ELEMENT_NODE ? focusNode : focusNode.parentElement;
            // TODO Is it possible to do this in a way so it’s included in undo history?
            item.dataset.completed = item.dataset.completed !== 'true';
            const nextItem = item.nextElementSibling;
            if (nextItem)
            {
                const range = list.ownerDocument.createRange();
                range.setStart(nextItem, 0);
                range.setEnd(nextItem, 0);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            break;
        }
        case 'Tab':
        {
            event.preventDefault();
            // TODO Check if it makese sense
            list.ownerDocument.execCommand('indent');
            break;
        }
        case 'Shift+Tab':
        {
            event.preventDefault();
            // TODO Check if it makese sense
            list.ownerDocument.execCommand('unindent');
            break;
        }
        case 'Ctrl+a':
        case 'Meta+a':
        {
            // TODO Select only current item
        }
    }
}

document.querySelector('button').addEventListener('click', handleAddButtonClick);
document.querySelector('ul').addEventListener('keydown', handleListKeyup);
document.querySelector('ul').addEventListener('keyup', handleListKeydown);
