document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const categorySelect = document.getElementById('category-select');
    const prioritySelect = document.getElementById('priority-select');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const todosContainer = document.getElementById('todos-container');
    const emptyImage = document.querySelector('.empty-image');

    // Create task item
    const createTaskItem = (text, category, priority, timestamp = null, completed = false) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (completed) li.classList.add('done');
        
        li.classList.add(`priority-${priority.toLowerCase()}`);
        
        const taskId = Date.now().toString();
        const createdTime = timestamp || new Date().toLocaleString();
        
        li.dataset.taskId = taskId;
        li.dataset.category = category;
        li.dataset.priority = priority;
        li.dataset.timestamp = createdTime;

        li.innerHTML = `
            <label class="task-main">
                <div class="task-header">
                    <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''}>
                    <div class="task-text-container">
                        <span class="task-category">${category}</span>
                        <span class="task-text">${escapeHtml(text)}</span>
                    </div>
                </div>
                <div class="task-timestamp">${createdTime}</div>
            </label>
            <div class="task-buttons">
                <button class="edit-btn" aria-label="Edit" ${completed ? 'style="display:none;"' : ''}>
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" aria-label="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        return li;
    };

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Toggle empty state
    const toggleEmptyState = () => {
        const isEmpty = taskList.children.length === 0;
        emptyImage.style.display = isEmpty ? 'block' : 'none';
        todosContainer.classList.toggle('has-items', !isEmpty);
    };

    // Add task
    const addTask = (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const category = categorySelect.value;
        const priority = prioritySelect.value;

        const li = createTaskItem(text, category, priority);
        taskList.appendChild(li);
        taskInput.value = '';
        toggleEmptyState();
    };

    // Inline edit function
    const startInlineEdit = (li) => {
        if (li.classList.contains('done')) return; // Prevent editing completed tasks

        const taskTextSpan = li.querySelector('.task-text');
        const originalText = taskTextSpan.textContent;
        const taskTextContainer = taskTextSpan.parentElement;

        // Create inline edit input
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'inline-edit-input';
        editInput.value = originalText;

        // Create save and cancel buttons
        const editActions = document.createElement('div');
        editActions.className = 'edit-actions';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        saveBtn.type = 'button';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        cancelBtn.type = 'button';

        editActions.appendChild(saveBtn);
        editActions.appendChild(cancelBtn);

        // Replace text with input
        taskTextContainer.innerHTML = '';
        taskTextContainer.appendChild(editInput);
        taskTextContainer.appendChild(editActions);
        editInput.focus();

        // Save function
        const saveEdit = () => {
            const newText = editInput.value.trim();
            if (newText) {
                taskTextSpan.textContent = newText;
            } else {
                taskTextSpan.textContent = originalText;
            }
            taskTextContainer.innerHTML = '';
            taskTextContainer.appendChild(document.createElement('span')).className = 'task-category';
            taskTextContainer.querySelector('.task-category').textContent = li.dataset.category;
            const newSpan = document.createElement('span');
            newSpan.className = 'task-text';
            newSpan.textContent = taskTextSpan.textContent;
            taskTextContainer.appendChild(newSpan);
        };

        // Cancel function
        const cancelEdit = () => {
            taskTextContainer.innerHTML = '';
            const categorySpan = document.createElement('span');
            categorySpan.className = 'task-category';
            categorySpan.textContent = li.dataset.category;
            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = originalText;
            taskTextContainer.appendChild(categorySpan);
            taskTextContainer.appendChild(textSpan);
        };

        saveBtn.addEventListener('click', saveEdit);
        cancelBtn.addEventListener('click', cancelEdit);
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
        });
    };

    // Event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTask(e);
    });

    // Delegated click for edit/delete
    taskList.addEventListener('click', (e) => {
        const li = e.target.closest('li.task-item');
        if (!li) return;

        if (e.target.closest('.delete-btn')) {
            li.remove();
            toggleEmptyState();
            return;
        }

        if (e.target.closest('.edit-btn')) {
            startInlineEdit(li);
        }
    });

    // Checkbox change handler
    taskList.addEventListener('change', (e) => {
        if (!e.target.matches('input.checkbox')) return;
        const li = e.target.closest('li.task-item');
        if (li) {
            li.classList.toggle('done', e.target.checked);
            
            // Hide/show edit button
            const editBtn = li.querySelector('.edit-btn');
            if (li.classList.contains('done')) {
                editBtn.style.display = 'none';
            } else {
                editBtn.style.display = 'grid';
            }
        }
    });

    // Initialize state
    toggleEmptyState();
});
