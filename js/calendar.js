function updateCalendar() {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Actualizar título del mes
    document.getElementById('current-month').textContent = `${monthNames[appData.currentMonth]} ${appData.currentYear}`;

    // Obtener el número de días en el mes
    const daysInMonth = new Date(appData.currentYear, appData.currentMonth + 1, 0).getDate();

    // Generar la estructura de la tabla
    const table = document.getElementById('grid-calendar');
    table.innerHTML = '';

    // Crear fila para los días de la semana
    const weekdayRow = document.createElement('tr');
    const emptyWeekdayHeader = document.createElement('th');
    weekdayRow.appendChild(emptyWeekdayHeader);

    // Abreviaturas de los días de la semana
    const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    // Añadir días de la semana como encabezados
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(appData.currentYear, appData.currentMonth, day);
        // Ajustar para que lunes sea 0 y domingo sea 6
        const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;

        const weekdayHeader = document.createElement('th');
        weekdayHeader.textContent = weekdays[dayOfWeek];

        // Marcar fines de semana
        if (dayOfWeek === 5 || dayOfWeek === 6) {
            weekdayHeader.classList.add('weekend');
        }

        weekdayRow.appendChild(weekdayHeader);
    }

    table.appendChild(weekdayRow);

    // Crear encabezado con los números del mes
    const headerRow = document.createElement('tr');

    // Primera celda vacía (esquina superior izquierda)
    const emptyHeader = document.createElement('th');
    emptyHeader.textContent = 'Empleado / Día';
    headerRow.appendChild(emptyHeader);

    // Añadir días del mes como encabezados
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(appData.currentYear, appData.currentMonth, day);
        const dayHeader =
            document.createElement('th');
    dayHeader.textContent = day;

    // Marcar fines de semana
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayHeader.classList.add('weekend');
    }

    // Marcar día actual
    const today = new Date();
    if (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()) {
        dayHeader.classList.add('today');
    }

    headerRow.appendChild(dayHeader);
}

table.appendChild(headerRow);

    // Crear filas para cada empleado
    appData.staff.forEach(staff => {
        const row = document.createElement('tr');

        // Nombre del empleado en la primera columna
        const nameCell = document.createElement('td');
        nameCell.textContent = staff.name;
        row.appendChild(nameCell);

        // Añadir celdas para cada día del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(appData.currentYear, appData.currentMonth, day);
            const dateString = formatDate(date);
            const cell = document.createElement('td');

            // Marcar fines de semana
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                cell.classList.add('weekend');
            }

            // Verificar si hay un turno asignado para este empleado en esta fecha
            if (appData.shifts[dateString]) {
                const shift = appData.shifts[dateString].find(s => s.staff_id === staff.id);
                if (shift) {
                    const shiftCode = document.createElement('span');
                    shiftCode.className = `shift-code ${getShiftClass(shift.shift_type)}`;
                    shiftCode.textContent = getShiftCode(shift.shift_type);

                    // Añadir evento para editar el turno
                    shiftCode.addEventListener('click', function() {
                        editShift(dateString, staff.id, shift.shift_type);
                    });

                    cell.appendChild(shiftCode);
                }
            }

            // Añadir evento para asignar nuevo turno
            cell.addEventListener('dblclick', function() {
                showAssignShiftModal(dateString, staff.id, staff.name);
            });

            row.appendChild(cell);
        }

        table.appendChild(row);
    });

    table.style.opacity = '0';
    table.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        table.style.transition = 'opacity 0.3s, transform 0.3s';
        table.style.opacity = '1';
        table.style.transform = 'translateY(0)';
    }, 50);
}


function goToPrevMonth() {
    appData.currentMonth--;
    if (appData.currentMonth < 0) {
        appData.currentMonth = 11;
        appData.currentYear--;
    }
    updateCalendar();
}

function goToNextMonth() {
    appData.currentMonth++;
    if (appData.currentMonth > 11) {
        appData.currentMonth = 0;
        appData.currentYear++;
    }
    updateCalendar();
}

function showAssignShiftModal(dateString, staffId, staffName) {
    const date = new Date(dateString);

    // Verificar si el empleado está disponible este día de la semana
    const dayOfWeek = date.getDay();
    // Convertir de domingo (0) a lunes (0)
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const staffMember = appData.staff.find(s => s.id === staffId);
    if (!staffMember.availability.days[adjustedDayOfWeek]) {
        alert(`${staffName} no está disponible los ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'][adjustedDayOfWeek]}.`);
        return;
    }

    document.getElementById('shift-date').value = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    document.getElementById('shift-date').dataset.date = dateString;
    document.getElementById('shift-staff').value = staffName;
    document.getElementById('shift-staff').dataset.staffId = staffId;

    // Actualizar los turnos disponibles para este empleado
    updateAvailableShifts(staffId);

    // Mostrar modal
    document.getElementById('shift-modal').style.display = 'block';
    document.getElementById('remove-shift').style.display = 'none';
}

function assignShift(e) {
    e.preventDefault();

    const dateString = document.getElementById('shift-date').dataset.date;
    const staffId = parseInt(document.getElementById('shift-staff').dataset.staffId);
    const shiftType = document.getElementById('shift-type').value;

    // Buscar el empleado
    const staffMember = appData.staff.find(staff => staff.id === staffId);

    if (!staffMember) {
        alert('Empleado no encontrado');
        return;
    }

    // Verificar si ya existe un turno para ese empleado en esa fecha
    if (appData.shifts[dateString]) {
        const existingShiftIndex = appData.shifts[dateString].findIndex(shift => shift.staff_id === staffId);

        if (existingShiftIndex !== -1) {
            // Actualizar turno existente
            appData.shifts[dateString][existingShiftIndex].shift_type = shiftType;
        } else {
            // Añadir nuevo turno para este empleado en esta fecha
            appData.shifts[dateString].push({
                staff_id: staffId,
                staff_name: staffMember.name,
                shift_type: shiftType
            });
        }
    } else {
        // Crear nuevo registro para la fecha
        appData.shifts[dateString] = [{
            staff_id: staffId,
            staff_name: staffMember.name,
            shift_type: shiftType
        }];
    }

    // Guardar datos y actualizar calendario
    saveData();
    updateCalendar();

    // Cerrar modal
    document.getElementById('shift-modal').style.display = 'none';
}

function removeShift() {
    const dateString = document.getElementById('shift-date').dataset.date;
    const staffId = parseInt(document.getElementById('shift-staff').dataset.staffId);

    if (appData.shifts[dateString]) {
        // Filtrar para eliminar el turno del empleado seleccionado
        appData.shifts[dateString] = appData.shifts[dateString].filter(shift => shift.staff_id !== staffId);

        // Si no quedan turnos para esa fecha, eliminar la fecha
        if (appData.shifts[dateString].length === 0) {
            delete appData.shifts[dateString];
        }

        // Guardar datos y actualizar calendario
        saveData();
        updateCalendar();
    }

    // Cerrar modal
    document.getElementById('shift-modal').style.display = 'none';
}

function printSchedule() {
    // Preparar para imprimir
    const originalTitle = document.title;
    document.title = `Turnos - ${document.getElementById('current-month').textContent}`;

    // Crear una hoja de estilos específica para impresión
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #grid-calendar-container, #grid-calendar-container * {
        visibility: visible;
      }
      #grid-calendar-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      header, .controls, .calendar-legend, nav, button {
        display: none !important;
      }
    }
  `;
    document.head.appendChild(printStyles);

    window.print();

    // Restaurar después de imprimir
    document.title = originalTitle;
    document.head.removeChild(printStyles);
}

function exportSchedule() {
    // Crear un objeto con los datos del mes actual
    const monthData = {
        month: appData.currentMonth,
        year: appData.currentYear,
        shifts: {}
    };

    // Filtrar solo los turnos del mes actual
    Object.keys(appData.shifts).forEach(dateString => {
        const date = new Date(dateString);
        if (date.getMonth() === appData.currentMonth && date.getFullYear() === appData.currentYear) {
            monthData.shifts[dateString] = appData.shifts[dateString];
        }
    });

    // Convertir a JSON y descargar
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(monthData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `turnos_${appData.currentMonth + 1}_${appData.currentYear}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
function updateAvailableShifts(staffId) {
    const staffMember = appData.staff.find(staff => staff.id === parseInt(staffId));
    if (!staffMember) return;

    const shiftTypeSelect = document.getElementById('shift-type');
    shiftTypeSelect.innerHTML = '';

    if (staffMember.availability.morning) {
        const option = document.createElement('option');
        option.value = 'morning';
        option.textContent = 'Mañana (M)';
        shiftTypeSelect.appendChild(option);
    }

    if (staffMember.availability.evening) {
        const option = document.createElement('option');
        option.value = 'evening';
        option.textContent = 'Tarde (T)';
        shiftTypeSelect.appendChild(option);
    }

    if (staffMember.availability.night) {
        const option = document.createElement('option');
        option.value = 'night';
        option.textContent = 'Noche (N)';
        shiftTypeSelect.appendChild(option);
    }

    if (staffMember.availability.split) {
        const option = document.createElement('option');
        option.value = 'split';
        option.textContent = 'Partido (P)';
        shiftTypeSelect.appendChild(option);
    }

    // Vacaciones siempre disponible
    const vacationOption = document.createElement('option');
    vacationOption.value = 'vacation';
    vacationOption.textContent = 'Vacaciones (V)';
    shiftTypeSelect.appendChild(vacationOption);
}

function editShift(dateString, staffId, shiftType) {
    const date = new Date(dateString);
    const staffMember = appData.staff.find(s => s.id === staffId);

    if (!staffMember) {
        alert('Empleado no encontrado');
        return;
    }

    document.getElementById('shift-date').value = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    document.getElementById('shift-date').dataset.date = dateString;
    document.getElementById('shift-staff').value = staffMember.name;
    document.getElementById('shift-staff').dataset.staffId = staffId;

    // Actualizar los turnos disponibles para este empleado
    updateAvailableShifts(staffId);

    // Seleccionar el turno actual
    document.getElementById('shift-type').value = shiftType;

    // Mostrar modal
    document.getElementById('shift-modal').style.display = 'block';
    document.getElementById('remove-shift').style.display = 'block';
}

function clearSchedule() {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los turnos del mes actual? Esta acción no se puede deshacer.')) {
        // Obtener el año y mes actual
        const year = appData.currentYear;
        const month = appData.currentMonth;

        // Filtrar para eliminar solo los turnos del mes actual
        Object.keys(appData.shifts).forEach(dateString => {
            const date = new Date(dateString);
            if (date.getFullYear() === year && date.getMonth() === month) {
                delete appData.shifts[dateString];
            }
        });

        // Guardar datos y actualizar calendario
        saveData();
        updateCalendar();

        alert('Todos los turnos del mes han sido eliminados.');
    }
}

function autoSchedule() {
    if (confirm('¿Deseas asignar automáticamente los turnos para este mes? Esto respetará las restricciones de disponibilidad y descansos.')) {
        // Obtener el año y mes actual
        const year = appData.currentYear;
        const month = appData.currentMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Limpiar turnos existentes del mes actual
        clearScheduleWithoutConfirmation();

        // Objeto para llevar el seguimiento de los días trabajados por cada empleado
        const staffStats = {};
        appData.staff.forEach(staff => {
            staffStats[staff.id] = {
                lastWorkDay: null,
                lastShiftType: null,
                daysWorkedThisWeek: 0,
                hoursWorkedThisWeek: 0,
                targetHours: staff.contractHours || 40, // Usar las horas de contrato
                consecutiveDaysOff: 0,
                totalDaysWorked: 0,
                weeklyDaysOff: []
            };
        });

        // Para cada semana del mes
        const weeksInMonth = Math.ceil(daysInMonth / 7);

        for (let week = 0; week < weeksInMonth; week++) {
            // Resetear contadores semanales
            appData.staff.forEach(staff => {
                staffStats[staff.id].daysWorkedThisWeek = 0;
                staffStats[staff.id].hoursWorkedThisWeek = 0;
                staffStats[staff.id].weeklyDaysOff = [];
            });

            // Para cada día de la semana
            for (let weekday = 0; weekday < 7; weekday++) {
                const dayOfMonth = week * 7 + weekday + 1;
                if (dayOfMonth > daysInMonth) continue;

                const date = new Date(year, month, dayOfMonth);
                const dateString = formatDate(date);

                // Inicializar registro de turnos para esta fecha
                if (!appData.shifts[dateString]) {
                    appData.shifts[dateString] = [];
                }

                // Asignar turnos de mañana, tarde y noche asegurando cobertura
                const morningAssigned = assignShiftForDay(dateString, 'morning', staffStats, weekday);
                const eveningAssigned = assignShiftForDay(dateString, 'evening', staffStats, weekday);
                const nightAssigned = assignShiftForDay(dateString, 'night', staffStats, weekday);

                // Si no se pudo asignar algún turno, intentar con restricciones relajadas
                if (!morningAssigned) {
                    assignShiftWithRelaxedRules(dateString, 'morning', staffStats, weekday);
                }
                if (!eveningAssigned) {
                    assignShiftWithRelaxedRules(dateString, 'evening', staffStats, weekday);
                }
                if (!nightAssigned) {
                    assignShiftWithRelaxedRules(dateString, 'night', staffStats, weekday);
                }

                // Actualizar estadísticas de trabajo
                updateWorkingStats(dateString, staffStats);
            }

            // Asignar días libres para empleados que no han tenido suficientes
            ensureWeeklyDaysOff(week, daysInMonth, year, month, staffStats);

            // Asignar vacaciones para completar horas de contrato
            assignVacationDays(week, daysInMonth, year, month, staffStats);
        }

        // Guardar datos y actualizar calendario
        saveData();
        updateCalendar();

        alert('Se han asignado automáticamente los turnos para este mes.');
    }
}

function clearScheduleWithoutConfirmation() {
    // Obtener el año y mes actual
    const year = appData.currentYear;
    const month = appData.currentMonth;

    // Filtrar para eliminar solo los turnos del mes actual
    Object.keys(appData.shifts).forEach(dateString => {
        const date = new Date(dateString);
        if (date.getFullYear() === year && date.getMonth() === month) {
            delete appData.shifts[dateString];
        }
    });
}

function assignShiftForDay(dateString, shiftType, staffStats, dayOfWeek) {
    // Filtrar empleados disponibles para este turno y día
    const availableStaff = appData.staff.filter(staff => {
        // Verificar disponibilidad para este día de la semana
        if (!staff.availability.days[dayOfWeek]) return false;

        // Verificar disponibilidad para este tipo de turno
        if (!staff.availability[shiftType]) return false;

        // Verificar si ya tiene un turno asignado este día
        if (appData.shifts[dateString] && appData.shifts[dateString].some(shift => shift.staff_id === staff.id)) {
            return false;
        }

        // Verificar descanso de 12 horas entre turnos
        const lastWorkDay = staffStats[staff.id].lastWorkDay;
        const lastShiftType = staffStats[staff.id].lastShiftType;

        if (lastWorkDay) {
            const lastDate = new Date(lastWorkDay);
            const currentDate = new Date(dateString);
            const hoursDiff = (currentDate - lastDate) / (1000 * 60 * 60);

            // Si el último turno fue de noche y el actual es de mañana, necesita más descanso
            if (lastShiftType === 'night' && shiftType === 'morning' && hoursDiff < 24) {
                return false;
            }

            // Para otros turnos, verificar 12 horas de descanso
            if (hoursDiff < 12) {
                return false;
            }
        }

        // Verificar máximo 5 días de trabajo a la semana
        if (staffStats[staff.id].daysWorkedThisWeek >= 5) {
            return false;
        }

        // Verificar que no exceda las horas contratadas
        const hoursPerShift = getHoursForShiftType(shiftType);
        const targetHours = staff.contractHours || 40;
        if (staffStats[staff.id].hoursWorkedThisWeek + hoursPerShift > targetHours) {
            return false;
        }

        return true;
    });

    if (availableStaff.length > 0) {
        // Ordenar por prioridad:
        // 1. Empleados que están más lejos de completar sus horas contratadas
        // 2. Empleados con menos días trabajados en total
        availableStaff.sort((a, b) => {
            const aTargetHours = a.contractHours || 40;
            const bTargetHours = b.contractHours || 40;

            const aHoursRemaining = aTargetHours - staffStats[a.id].hoursWorkedThisWeek;
            const bHoursRemaining = bTargetHours - staffStats[b.id].hoursWorkedThisWeek;

            // Si la diferencia de horas restantes es significativa
            if (Math.abs(aHoursRemaining - bHoursRemaining) > 4) {
                return bHoursRemaining - aHoursRemaining; // Mayor diferencia primero
            }

            // Si tienen horas similares, ordenar por días trabajados
            return staffStats[a.id].totalDaysWorked - staffStats[b.id].totalDaysWorked;
        });

        // Asignar turno al empleado seleccionado
        const selectedStaff = availableStaff[0];

        appData.shifts[dateString].push({
            staff_id: selectedStaff.id,
            staff_name: selectedStaff.name,
            shift_type: shiftType
        });

        // Actualizar seguimiento
        staffStats[selectedStaff.id].lastWorkDay = dateString;
        staffStats[selectedStaff.id].lastShiftType = shiftType;
        staffStats[selectedStaff.id].daysWorkedThisWeek++;
        staffStats[selectedStaff.id].totalDaysWorked++;
        staffStats[selectedStaff.id].consecutiveDaysOff = 0;

        // Actualizar horas trabajadas según el tipo de turno
        const hoursPerShift = getHoursForShiftType(shiftType);
        staffStats[selectedStaff.id].hoursWorkedThisWeek += hoursPerShift;

        return true;
    }

    return false;
}

function assignShiftWithRelaxedRules(dateString, shiftType, staffStats, dayOfWeek) {
    // Filtrar empleados con reglas más relajadas
    const availableStaff = appData.staff.filter(staff => {
        // Verificar disponibilidad para este tipo de turno
        if (!staff.availability[shiftType]) return false;

        // Verificar si ya tiene un turno asignado este día
        if (appData.shifts[dateString] && appData.shifts[dateString].some(shift => shift.staff_id === staff.id)) {
            return false;
        }

        // Verificar que no exceda demasiado las horas contratadas
        const hoursPerShift = getHoursForShiftType(shiftType);
        const targetHours = staff.contractHours || 40;
        // Permitir hasta un 20% más de horas en casos excepcionales
        if (staffStats[staff.id].hoursWorkedThisWeek + hoursPerShift > targetHours * 1.2) {
            return false;
        }

        return true;
    });

    if (availableStaff.length > 0) {
        // Ordenar por prioridad (menos días trabajados primero)
        availableStaff.sort((a, b) => {
            return staffStats[a.id].totalDaysWorked - staffStats[b.id].totalDaysWorked;
        });

        // Asignar turno al empleado con menos días trabajados
        const selectedStaff = availableStaff[0];

        appData.shifts[dateString].push({
            staff_id: selectedStaff.id,
            staff_name: selectedStaff.name,
            shift_type: shiftType
        });

        // Actualizar seguimiento
        staffStats[selectedStaff.id].lastWorkDay = dateString;
        staffStats[selectedStaff.id].lastShiftType = shiftType;
        staffStats[selectedStaff.id].daysWorkedThisWeek++;
        staffStats[selectedStaff.id].totalDaysWorked++;
        staffStats[selectedStaff.id].consecutiveDaysOff = 0;

        // Actualizar horas trabajadas según el tipo de turno
        const hoursPerShift = getHoursForShiftType(shiftType);
        staffStats[selectedStaff.id].hoursWorkedThisWeek += hoursPerShift;

        return true;
    }

    // Si aún no se puede asignar, crear un turno de "vacante" para indicar falta de personal
    appData.shifts[dateString].push({
        staff_id: -1, // ID especial para indicar vacante
        staff_name: "VACANTE",
        shift_type: shiftType
    });

    return false;
}

function updateWorkingStats(dateString, staffStats) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convertir a formato lunes=0, domingo=6

    // Para cada empleado, verificar si trabajó este día
    appData.staff.forEach(staff => {
        const worked = appData.shifts[dateString] &&
            appData.shifts[dateString].some(shift => shift.staff_id === staff.id && shift.shift_type !== 'vacation');

        if (!worked) {
            // Si no trabajó, incrementar contador de días libres consecutivos
            staffStats[staff.id].consecutiveDaysOff++;

            // Registrar día libre para esta semana
            if (!staffStats[staff.id].weeklyDaysOff.includes(dayOfWeek)) {
                staffStats[staff.id].weeklyDaysOff.push(dayOfWeek);
            }
        }
    });
}

function ensureWeeklyDaysOff(week, daysInMonth, year, month, staffStats) {
    // Para cada empleado, verificar si ha tenido al menos 2 días libres esta semana
    appData.staff.forEach(staff => {
        if (staffStats[staff.id].weeklyDaysOff.length < 2) {
            // Necesita más días libres
            let daysNeeded = 2 - staffStats[staff.id].weeklyDaysOff.length;

            // Buscar días trabajados que se puedan convertir en libres
            for (let weekday = 0; weekday < 7 && daysNeeded > 0; weekday++) {
                const dayOfMonth = week * 7 + weekday + 1;
                if (dayOfMonth > daysInMonth) continue;

                const date = new Date(year, month, dayOfMonth);
                const dateString = formatDate(date);

                // Verificar si trabajó este día
                if (appData.shifts[dateString]) {
                    const staffShifts = appData.shifts[dateString].filter(shift =>
                        shift.staff_id === staff.id && shift.shift_type !== 'vacation');

                    if (staffShifts.length > 0) {
                        // Eliminar turnos de este empleado para este día
                        appData.shifts[dateString] = appData.shifts[dateString].filter(shift =>
                            shift.staff_id !== staff.id || shift.shift_type === 'vacation');

                        // Añadir a la lista de días libres
                        const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
                        if (!staffStats[staff.id].weeklyDaysOff.includes(dayOfWeek)) {
                            staffStats[staff.id].weeklyDaysOff.push(dayOfWeek);
                        }

                        // Actualizar estadísticas
                        staffStats[staff.id].daysWorkedThisWeek--;
                        staffStats[staff.id].totalDaysWorked--;

                        // Restar horas trabajadas
                        staffShifts.forEach(shift => {
                            const hoursPerShift = getHoursForShiftType(shift.shift_type);
                            staffStats[staff.id].hoursWorkedThisWeek -= hoursPerShift;
                        });

                        // Intentar asignar estos turnos a otros empleados
                        staffShifts.forEach(shift => {
                            assignShiftWithRelaxedRules(dateString, shift.shift_type, staffStats, dayOfWeek);
                        });

                        daysNeeded--;
                    }
                }
            }
        }
    });
}

function assignVacationDays(week, daysInMonth, year, month, staffStats) {
    appData.staff.forEach(staff => {
        // Si el empleado ha trabajado menos horas de las contratadas
        const targetHours = staff.contractHours || 40;
        const workedHours = staffStats[staff.id].hoursWorkedThisWeek;

        if (workedHours < targetHours) {
            // Calcular cuántas horas faltan
            const missingHours = targetHours - workedHours;

            // Buscar días sin turno asignado para este empleado
            for (let weekday = 0; weekday < 7; weekday++) {
                const dayOfMonth = week * 7 + weekday + 1;
                if (dayOfMonth > daysInMonth) continue;

                const date = new Date(year, month, dayOfMonth);
                const dateString = formatDate(date);
                const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;

                // Verificar si el empleado está disponible este día
                if (!staff.availability.days[dayOfWeek]) continue;

                // Verificar si ya tiene un turno asignado este día
                const hasShift = appData.shifts[dateString] &&
                    appData.shifts[dateString].some(shift => shift.staff_id === staff.id);

                if (!hasShift) {
                    // Asignar día de vacaciones
                    if (!appData.shifts[dateString]) {
                        appData.shifts[dateString] = [];
                    }

                    appData.shifts[dateString].push({
                        staff_id: staff.id,
                        staff_name: staff.name,
                        shift_type: 'vacation'
                    });

                    // Actualizar estadísticas
                    staffStats[staff.id].hoursWorkedThisWeek += 8; // Considerar 8 horas por día de vacaciones

                    // Si ya se completaron las horas necesarias, salir del bucle
                    if (staffStats[staff.id].hoursWorkedThisWeek >= targetHours) {
                        break;
                    }
                }
            }
        }
    });
}

function getHoursForShiftType(shiftType) {
    // Calcular horas según el tipo de turno basado en la configuración
    switch(shiftType) {
        case 'morning': {
            const startTime = appData.settings.morningStart.split(':').map(Number);
            const endTime = appData.settings.morningEnd.split(':').map(Number);
            return calculateHours(startTime, endTime);
        }
        case 'evening': {
            const startTime = appData.settings.eveningStart.split(':').map(Number);
            const endTime = appData.settings.eveningEnd.split(':').map(Number);
            return calculateHours(startTime, endTime);
        }
        case 'night': {
            const startTime = appData.settings.nightStart.split(':').map(Number);
            const endTime = appData.settings.nightEnd.split(':').map(Number);
            // Para turnos nocturnos que cruzan la medianoche
            return calculateHours(startTime, endTime, true);
        }
        case 'split': {
            // Para turnos partidos, sumar las horas de ambos periodos
            const periods = appData.settings.splitHours.split(',');
            let totalHours = 0;

            periods.forEach(period => {
                const [start, end] = period.trim().split('-');
                const startTime = start.split(':').map(Number);
                const endTime = end.split(':').map(Number);
                totalHours += calculateHours(startTime, endTime);
            });
        }}}

function calculateHours(startTime, endTime, overnight = false) {
    let startHour = startTime[0] + startTime[1] / 60;
    let endHour = endTime[0] + endTime[1] / 60;

    // Si el turno cruza la medianoche
    if (overnight && endHour < startHour) {
        return (24 - startHour) + endHour;
    }

    return endHour - startHour;
}

function exportToPDF() {
    const element = document.getElementById('grid-calendar-container');
    html2pdf()
        .from(element)
        .save('calendario_turnos.pdf');
}