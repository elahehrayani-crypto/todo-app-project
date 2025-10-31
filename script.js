document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const taskInput       = document.getElementById('task-input');
  const categorySelect  = document.getElementById('category-select');
  const prioritySelect  = document.getElementById('priority-select');
  const addTaskBtn      = document.getElementById('add-task-btn');
  const taskList        = document.getElementById('task-list');
  const todosContainer  = document.getElementById('todos-container');
  const emptyImage      = document.querySelector('.empty-image');

  // Storage
  const STORAGE_KEY = 'todoTasks';

  const loadTasks = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  };

  const snapshotTasks = () => {
    const out = [];
    taskList.querySelectorAll('li.task-item').forEach(li => {
      out.push({
        id: li.dataset.taskId,
        text: li.querySelector('.task-text')?.textContent ?? '',
        category: li.dataset.category,
        priority: li.dataset.priority,
        timestamp: li.dataset.timestamp,
        completed: li.classList.contains('done')
      });
    });
    return out;
  };

  // Utils
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const toggleEmptyState = () => {
    const isEmpty = taskList.children.length === 0;
    emptyImage.style.display = isEmpty ? 'block' : 'none';
    todosContainer.classList.toggle('has-items', !isEmpty);
  };

  // Factory
  const createTaskItem = (text, category, priority, timestamp = null, completed = false, forcedId = null) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (completed) li.classList.add('done');

    li.classList.add(`priority-${String(priority).toLowerCase()}`);

    const taskId = forcedId || Date.now().toString();
    const createdTime = timestamp || new Date().toLocaleString();

    li.dataset.taskId   = taskId;
    li.dataset.category = category;
    li.dataset.priority = priority;
    li.dataset.timestamp= createdTime;

    li.innerHTML = `
      <label class="task-main">
        <div class="task-header">
          <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''}>
          <div class="task-text-container">
            <span class="task-category">${escapeHtml(category)}</span>
            <span class="task-text">${escapeHtml(text)}</span>
          </div>
        </div>
        <div class="task-timestamp">${escapeHtml(createdTime)}</div>
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

  // Create → Add
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
    saveTasks(snapshotTasks());
  };

  // Inline edit
  const startInlineEdit = (li) => {
    if (li.classList.contains('done')) return; // block editing completed

    const taskTextSpan      = li.querySelector('.task-text');
    const originalText      = taskTextSpan.textContent;
    const taskTextContainer = taskTextSpan.parentElement;

    const editInput = document.createElement('input');
    editInput.type  = 'text';
    editInput.className = 'inline-edit-input';
    editInput.value = originalText;

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

    // swap UI
    taskTextContainer.innerHTML = '';
    taskTextContainer.appendChild(editInput);
    taskTextContainer.appendChild(editActions);
    editInput.focus();

    const restoreView = (finalText) => {
      taskTextContainer.innerHTML = '';
      const categorySpan = document.createElement('span');
      categorySpan.className = 'task-category';
      categorySpan.textContent = li.dataset.category;

      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = finalText;

      taskTextContainer.appendChild(categorySpan);
      taskTextContainer.appendChild(textSpan);
    };

    const saveEdit = () => {
      const newText = editInput.value.trim();
      const finalText = newText || originalText;
      restoreView(finalText);
      saveTasks(snapshotTasks());
    };

    const cancelEdit = () => {
      restoreView(originalText);
    };

    saveBtn.addEventListener('click', saveEdit);
    cancelBtn.addEventListener('click', cancelEdit);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') cancelEdit();
    });
  };

  // Events
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask(e);
  });

  // Delegated click
  taskList.addEventListener('click', (e) => {
    const li = e.target.closest('li.task-item');
    if (!li) return;

    if (e.target.closest('.delete-btn')) {
      li.remove();
      toggleEmptyState();
      saveTasks(snapshotTasks());
      return;
    }

    if (e.target.closest('.edit-btn')) {
      startInlineEdit(li);
    }
  });

  // Checkbox change
  taskList.addEventListener('change', (e) => {
    if (!e.target.matches('input.checkbox')) return;
    const li = e.target.closest('li.task-item');
    if (!li) return;

    li.classList.toggle('done', e.target.checked);

    const editBtn = li.querySelector('.edit-btn');
    if (li.classList.contains('done')) {
      editBtn.style.display = 'none';
    } else {
      editBtn.style.display = 'grid';
    }
    saveTasks(snapshotTasks());
  });

  // Initial load from storage
  const initial = loadTasks();
  initial.forEach(t => {
    const li = createTaskItem(t.text, t.category, t.priority, t.timestamp, t.completed, t.id);
    taskList.appendChild(li);
  });
  toggleEmptyState();
});
