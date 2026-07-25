import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCommentNotification({
  postTitle,
  postSlug,
  authorName,
  content,
}: {
  postTitle: string;
  postSlug: string;
  authorName: string;
  content: string;
}) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!notifyEmail || !process.env.SMTP_USER) {
    console.log("邮件通知未配置，跳过发送");
    return;
  }

  const postUrl = `${process.env.AUTH_URL}/posts/${postSlug}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: notifyEmail,
      subject: `[博客] 新评论待审核 - ${postTitle}`,
      html: `
        <h3>新评论待审核</h3>
        <p><strong>文章：</strong><a href="${postUrl}">${postTitle}</a></p>
        <p><strong>评论者：</strong>${authorName}</p>
        <p><strong>内容：</strong></p>
        <blockquote>${content}</blockquote>
        <p><a href="${process.env.AUTH_URL}/admin/comments">前往后台审核</a></p>
      `,
    });
    console.log(`评论通知邮件已发送至 ${notifyEmail}`);
  } catch (error) {
    console.error("发送邮件通知失败:", error);
  }
}
