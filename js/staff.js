function updateStaffTable() {
    const staffTable = document.getElementById('staff-table').getElementsByTagName('tbody')[0];
    staffTable.innerHTML = '';

    appData.staff.forEach(staff => {
        const row = document.createElement('tr');

        // Nombre
        const nameCell = document.createElement('td');
        nameCell.textContent = staff.name;
        row.appendChild(nameCell);

        // Horas contratadas
        const hoursCell = document.createElement('td');
        hoursCell.textContent = `${staff.contractHours || 40} h/semana`;
        row.appendChild(hoursCell);

        // Disponibilidad
        const availabilityCell = document.createElement('td');
        let availabilityText = [];

        if (staff.availability.morning) availabilityText.push('Mañana (M)');
        if (staff.availability.evening) availabilityText.push('Tarde (T)');
        if (staff.availability.night) availabilityText.push('Noche (N)');
        if (staff.availability.split) availabilityText.push('Partido (P)');

        availabilityCell.textContent = availabilityText.join(', ');
        row.appendChild(availabilityCell);

        // Restricciones (días)
        const restrictionsCell = document.createElement('td');
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const availableDays = staff.availability.days.map((available, index) => available ? days[index] : null).filter(day => day !== null);

        restrictionsCell.textContent = availableDays.join(', ');
        row.appendChild(restrictionsCell);

        // Acciones
        const actionsCell = document.createElement('td');

        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', function() {
            editStaffMember(staff.id);
        });
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.className = 'danger';
        deleteButton.addEventListener('click', function() {
            deleteStaffMember(staff.id);
        });
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        staffTable.appendChild(row);
    });
}

function showAddStaffModal() {
    // Limpiar formulario
    document.getElementById('staff-form').reset();
    document.getElementById('staff-form').dataset.staffId = '';

    // Marcar todos los días como disponibles por defecto
    document.querySelectorAll('.checkbox-group.days input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    // Cambiar título del modal
    document.querySelector('#staff-modal h2').textContent = 'Añadir Empleado';

    // Mostrar modal
    document.getElementById('staff-modal').style.display = 'block';
}

function editStaffMember(staffId) {
    const staff = appData.staff.find(s => s.id === staffId);

    if (!staff) {
        alert('Empleado no encontrado');
        return;
    }

    // Rellenar formulario con datos del empleado
    document.getElementById('staff-name').value = staff.name;
    document.getElementById('contract-hours').value = staff.contractHours || 40;
    document.getElementById('morning-shift').checked = staff.availability.morning;
    document.getElementById('evening-shift').checked = staff.availability.evening;
    document.getElementById('night-shift').checked = staff.availability.night;
    document.getElementById('split-shift').checked = staff.availability.split;
    document.getElementById('notes').value = staff.notes || '';

    // Marcar días disponibles
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach((day, index) => {
        document.getElementById(day).checked = staff.availability.days[index];
    });

    // Guardar ID del empleado en el formulario
    document.getElementById('staff-form').dataset.staffId = staffId;

    // Cambiar título del modal
    document.querySelector('#staff-modal h2').textContent = 'Editar Empleado';

    // Mostrar modal
    document.getElementById('staff-modal').style.display = 'block';
}

function saveStaffMember(e) {
    e.preventDefault();

    const staffId = document.getElementById('staff-form').dataset.staffId;
    const name = document.getElementById('staff-name').value;
    const morningAvailable = document.getElementById('morning-shift').checked;
    const eveningAvailable = document.getElementById('evening-shift').checked;
    const nightAvailable = document.getElementById('night-shift').checked;
    const splitAvailable = document.getElementById('split-shift').checked;
    const notes = document.getElementById('notes').value;
    const contractHours = parseInt(document.getElementById('contract-hours').value);

    // Obtener días disponibles
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availableDays = days.map(day => document.getElementById(day).checked);

    const availability = {
        morning: morningAvailable,
        evening: eveningAvailable,
        night: nightAvailable,
        split: splitAvailable,
        days: availableDays
    };

    if (staffId) {
        // Actualizar empleado existente
        const staffIndex = appData.staff.findIndex(s => s.id === parseInt(staffId));
        if (staffIndex !== -1) {
            appData.staff[staffIndex].name = name;
            appData.staff[staffIndex].contractHours = contractHours;
            appData.staff[staffIndex].availability = availability;
            appData.staff[staffIndex].notes = notes;

            // Actualizar nombre en turnos asignados
            Object.keys(appData.shifts).forEach(dateString => {
                appData.shifts[dateString].forEach(shift => {
                    if (shift.staff_id === parseInt(staffId)) {
                        shift.staff_name = name;
                    }
                });
            });
        }
    } else {
        // Añadir nuevo empleado
        const newId = appData.staff.length > 0 ? Math.max(...appData.staff.map(s => s.id)) + 1 : 1;
        appData.staff.push({
            id: newId,
            name: name,
            contractHours: contractHours,
            availability: availability,
            notes: notes
        });
    }

    // Guardar datos y actualizar tabla
    saveData();
    updateStaffTable();
    updateCalendar();

    // Cerrar modal
    document.getElementById('staff-modal').style.display = 'none';
}

function deleteStaffMember(staffId) {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
        // Eliminar empleado
        appData.staff = appData.staff.filter(staff => staff.id !== staffId);

        // Eliminar turnos asignados a este empleado
        Object.keys(appData.shifts).forEach(dateString => {
            appData.shifts[dateString] = appData.shifts[dateString].filter(shift => shift.staff_id !== staffId);

            // Si no quedan turnos para esa fecha, eliminar la fecha
            if (appData.shifts[dateString].length === 0) {
                delete appData.shifts[dateString];
            }
        });

        // Guardar datos y actualizar tabla
        saveData();
        updateStaffTable();
        updateCalendar();
    }
}

function loadSettings() {
    document.getElementById('morning-start').value = appData.settings.morningStart;
    document.getElementById('morning-end').value = appData.settings.morningEnd;
    document.getElementById('evening-start').value = appData.settings.eveningStart;
    document.getElementById('evening-end').value = appData.settings.eveningEnd;
    document.getElementById('night-start').value = appData.settings.nightStart;
    document.getElementById('night-end').value = appData.settings.nightEnd;
    document.getElementById('split-hours').value = appData.settings.splitHours;
}

function saveSettings(e) {
    e.preventDefault();

    appData.settings.morningStart = document.getElementById('morning-start').value;
    appData.settings.morningEnd = document.getElementById('morning-end').value;
    appData.settings.eveningStart = document.getElementById('evening-start').value;
    appData.settings.eveningEnd = document.getElementById('evening-end').value;
    appData.settings.nightStart = document.getElementById('night-start').value;
    appData.settings.nightEnd = document.getElementById('night-end').value;
    appData.settings.splitHours = document.getElementById('split-hours').value;

    saveData();
    alert('Configuración guardada correctamente');
}
