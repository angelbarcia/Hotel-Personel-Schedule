// Datos de la aplicación
const appData = {
        staff: [
            {
                id: 1,
                name: "Ana García",
                contractHours: 40, // Horas semanales contratadas
                availability: {
                    morning: true,
                    evening: false,
                    night: false,
                    split: true,
                    days: [true, true, true, true, true, false, false]
                },
                notes: "Solo turnos de mañana entre semana"
            },
            {
                id: 2,
                name: "Carlos Rodríguez",
                contractHours: 30, // Horas semanales contratadas
                availability: {
                    morning: false,
                    evening: true,
                    night: true,
                    split: false,
                    days: [true, true, true, true, true, true, true]
                },
                notes: "Prefiere turnos de tarde y noche"
            },
            {
                id: 3,
                name: "Laura Martínez",
                contractHours: 20, // Horas semanales contratadas
                availability: {
                    morning: true,
                    evening: true,
                    night: false,
                    split: true,
                    days: [false, false, false, false, false, true, true]
                },
                notes: "Disponible solo fines de semana"
            }
        ],
    shifts: {}, // Se llenará con los turnos asignados
    settings: {
        morningStart: "07:00",
        morningEnd: "15:00",
        eveningStart: "15:00",
        eveningEnd: "23:00",
        nightStart: "23:00",
        nightEnd: "07:00",
        splitHours: "10:00-14:00, 17:00-21:00"
    },
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Navegación entre vistas
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    initApp();

    // Configurar navegación
    document.getElementById('nav-calendar').addEventListener('click', function(e) {
        e.preventDefault();
        showView('calendar-view');
    });

    document.getElementById('nav-staff').addEventListener('click', function(e) {
        e.preventDefault();
        showView('staff-view');
    });

    document.getElementById('nav-settings').addEventListener('click', function(e) {
        e.preventDefault();
        showView('settings-view');
    });

    // Configurar modales
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Configurar formularios
    document.getElementById('shift-settings').addEventListener('submit', saveSettings);
    document.getElementById('staff-form').addEventListener('submit', saveStaffMember);
    document.getElementById('shift-form').addEventListener('submit', assignShift);
    document.getElementById('remove-shift').addEventListener('click', removeShift);

    // Botones de acción
    document.getElementById('add-staff').addEventListener('click', showAddStaffModal);
    document.getElementById('print-schedule').addEventListener('click', printSchedule);
    document.getElementById('export-schedule').addEventListener('click', exportSchedule);
    document.getElementById('prev-month').addEventListener('click', goToPrevMonth);
    document.getElementById('next-month').addEventListener('click', goToNextMonth);
    document.getElementById('clear-schedule').addEventListener('click', clearSchedule);
    document.getElementById('auto-schedule').addEventListener('click', autoSchedule);
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
});

function initApp() {
    // Cargar datos guardados si existen
    const savedData = localStorage.getItem('hotelShiftData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        appData.staff = parsedData.staff || appData.staff;
        appData.shifts = parsedData.shifts || {};
        appData.settings = parsedData.settings || appData.settings;
    }

    // Inicializar vistas
    updateCalendar();
    updateStaffTable();
    loadSettings();
}

function showView(viewId) {
    // Ocultar todas las vistas
    const views = document.querySelectorAll('main > section');
    views.forEach(view => {
        view.classList.add('hidden-view');
        view.classList.remove('active-view');
    });

    // Mostrar la vista seleccionada
    document.getElementById(viewId).classList.remove('hidden-view');
    document.getElementById(viewId).classList.add('active-view');

    // Actualizar navegación
    const navItems = document.querySelectorAll('nav a');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Activar el elemento de navegación correspondiente
    const navId = 'nav-' + viewId.split('-')[0];
    document.getElementById(navId).classList.add('active');

    // Actualizar contenido si es necesario
    if (viewId === 'calendar-view') {
        updateCalendar();
    } else if (viewId === 'staff-view') {
        updateStaffTable();
    }
}

function saveData() {
    localStorage.setItem('hotelShiftData', JSON.stringify({
        staff: appData.staff,
        shifts: appData.shifts,
        settings: appData.settings
    }));
}

// Función para formatear fechas
function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// Función para obtener el código de turno
function getShiftCode(shiftType) {
    switch(shiftType) {
        case 'morning': return 'M';
        case 'evening': return 'T';
        case 'night': return 'N';
        case 'split': return 'P';
        case 'vacation': return 'V';
        default: return '';
    }
}

// Función para obtener la clase CSS del tipo de turno
function getShiftClass(shiftType) {
    return shiftType;
}
