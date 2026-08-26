import { Worker, type Job } from "bullmq";
import connection from "../config/ioRedis.js";
import { transporter } from "../utils/sendEmail.js";
import { ENV } from "../config/envConfig.js";

export const emailWorker = new Worker(
  "email_queue",
  async (job: Job) => {
    const mailOptions = {
      to: job.data.to || job.data.To,
      from: job.data.from || ENV.EMAIL_USER,
      subject: job.data.subject,
      html: job.data.html || job.data.htmlContent,
    };
    console.log(`Processing job ${job.id}...`);
    console.log(`Worker sending email to: ${mailOptions.to}`);
    const info = await transporter.sendMail(mailOptions);
    return info;
  },
  { connection }
);

emailWorker.on("completed", (job: Job) => {
  console.log(`Job ${job.id} (${job.name}) has been completed successfully.`);
});

emailWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} (${job?.name}) failed with error:`, err);
});

export default emailWorker;
