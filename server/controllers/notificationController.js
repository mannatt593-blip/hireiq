const pool = require("../config/db");

/* =================================
   GET NOTIFICATIONS
================================= */

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      unread_count: result.rows.filter(
        (notification) => !notification.is_read
      ).length,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

/* =================================
   MARK ONE AS READ
================================= */

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

/* =================================
   MARK ALL AS READ
================================= */

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
        AND is_read = FALSE
      RETURNING id
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Mark all notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

/* =================================
   DELETE NOTIFICATION
================================= */

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};