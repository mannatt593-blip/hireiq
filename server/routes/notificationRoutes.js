const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);

router.patch("/:id/read", markNotificationAsRead);

router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

router.delete("/:id", deleteNotification);

module.exports = router;