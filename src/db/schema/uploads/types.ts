import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { uploadsTable } from "./tables";

export type MediaUpload = InferSelectModel<typeof uploadsTable>;
export type NewMediaUpload = InferInsertModel<typeof uploadsTable>;
