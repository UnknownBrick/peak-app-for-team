CREATE TABLE `comments` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `user_id` text NOT NULL,
  `body` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
