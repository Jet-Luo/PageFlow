import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  pages: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentPage: v.optional(v.id('pages')),
    isPublished: v.boolean(),
    isArchived: v.boolean()
  })
    .index('by_user', ['userId'])
    .index('by_user_parent', ['userId', 'parentPage'])
})

// export default defineSchema({
//   documents: defineTable({
//     title: v.string(),
//     userId: v.string(),
//     isArchived: v.boolean(),
//     parentDocument: v.optional(v.id('documents')),
//     content: v.optional(v.string()),
//     coverImage: v.optional(v.string()),
//     icon: v.optional(v.string()),
//     isPublished: v.boolean()
//   })
//     .index('by_user', ['userId'])
//     .index('by_user_parent', ['userId', 'parentDocument'])
// })
