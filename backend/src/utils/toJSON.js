/** Shared toJSON options: expose `id` instead of `_id` and hide internals. */
export const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.password;
    return ret;
  },
};
