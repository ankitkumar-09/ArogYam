const express = require('express');
const router = express.Router();
const appointmentController = require('../Controllers/appointmentContoller');
const appointmentMiddleware = require('../middlewares/appointmentMiddleware');

// Defensive wrappers to prevent: "argument handler must be a function"
const mw = (fn) => (typeof fn === 'function' ? fn : (req, res, next) => next());
const h = (fn) =>
  (typeof fn === 'function'
    ? fn
    : (req, res) => res.status(501).json({ success: false, message: 'Handler not implemented' }));

router.get('/search', h(appointmentController.searchDoctors));
router.get('/doctor/:id', h(appointmentController.getDoctor));

router.get(
  '/availability',
  h(appointmentController.getAvailability)
);

// NEW: payment success -> create appointment + book slot
router.post(
  '/confirm-payment',
  mw(appointmentMiddleware.validateConfirmPaymentBody),
  h(appointmentController.confirmPayment)
);

// NEW: patient appointments
router.get(
  '/patient/:patientId',
  mw(appointmentMiddleware.validatePatientAppointmentsParams),
  h(appointmentController.getPatientAppointments)
);

// NEW: cancel appointment (also releases slot)
router.post(
  '/:appointmentId/cancel',
  mw(appointmentMiddleware.validateCancelAppointment),
  h(appointmentController.cancelAppointment)
);

// NEW: cancel slot directly (if required)
router.post(
  '/cancel-slot',
  mw(appointmentMiddleware.validateCancelSlotBody),
  h(appointmentController.cancelSlot)
);

// NEW: reschedule appointment
router.post(
  '/:appointmentId/reschedule',
  mw(appointmentMiddleware.validateRescheduleAppointment), // safe no-op if not implemented
  h(appointmentController.rescheduleAppointment)
);

module.exports = router;