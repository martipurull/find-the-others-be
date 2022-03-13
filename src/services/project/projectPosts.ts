import { Router } from 'express'
import commentsRouter from '../post/comments'
import postRouter from '../post'

const projectPostRouter = Router()

projectPostRouter.use('/', postRouter)
projectPostRouter.use('/:postId/comments', commentsRouter)


export default projectPostRouter

//OLD WAY: REPEATING CODE

// projectPostRouter.post('/', JWTAuth, parser.single('postImage'), async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const sender = await UserModel.findById(req.payload?._id)
//         if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
//         const project = await ProjectModel.findById(req.params.projectId)
//         const newPost = await new PostModel({
//             ...req.body,
//             sender,
//             isForProject: true,
//             postProject: project,
//             image: req.file?.path || '',
//             filename: req.file?.filename || ''
//         }).save()
//         const projectWithNewPost = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $push: { projectPosts: newPost._id } })
//         if (!projectWithNewPost) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
//         res.status(201).send(projectWithNewPost)
//     } catch (error) {
//         (error)
//     }
// })

// projectPostRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const project = await ProjectModel.findById(req.params.projectId).populate({ path: 'projectPosts', options: { sort: [['createdAt', 'asc']] } })
//         if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
//         res.send(project.projectPosts)
//     } catch (error) {
//         (error)
//     }
// })

// projectPostRouter.put('/:postId', JWTAuth, parser.single('postImage'), async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const project = await ProjectModel.findById(req.params.projectId)
//         if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
//         const sender = await UserModel.findById(req.payload?._id)
//         if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
//         const oldPost = await PostModel.findById(req.params.postId)
//         if (!oldPost) return next(createHttpError(404, `Post with id ${req.params.postId} cannot be found.`))
//         if (oldPost.sender.toString() === req.payload?._id) {
//             const editedPost = await PostModel.findByIdAndUpdate(req.params.postId, {
//                 ...req.body,
//                 sender,
//                 isForProject: true,
//                 postProject: project,
//                 image: req.file?.path || oldPost.image,
//                 filename: req.file?.filename || oldPost.filename
//             }, { new: true })
//             if (oldPost.filename && req.file) {
//                 await cloudinary.uploader.destroy(oldPost.filename)
//             }
//             res.send(editedPost)
//         } else {
//             next(createHttpError(401, "You cannot edit someone else's post"))
//         }
//     } catch (error) {
//         (error)
//     }
// })

// projectPostRouter.delete('/:postId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const project = await ProjectModel.findById(req.params.projectId)
//         if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
//         const sender = await UserModel.findById(req.payload?._id)
//         if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
//         const oldPost = await PostModel.findById(req.params.postId)
//         if (!oldPost) return next(createHttpError(404, `Post with id ${req.params.postId} cannot be found.`))
//         if (oldPost.sender.toString() === req.payload?._id) {
//             const projectWithoutPost = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $pull: { projectPosts: oldPost._id } })
//             if (!projectWithoutPost) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
//             const deletedPost = await PostModel.findByIdAndDelete(req.params.postId)
//             if (!deletedPost) return next(createHttpError(404, `Post with id ${req.params.postId} cannot be found.`))
//             if (deletedPost.filename) {
//                 await cloudinary.uploader.destroy(deletedPost.filename)
//             }
//         } else {
//             next(createHttpError(401, "You cannot delete someone else's post"))
//         }
//         res.status(204).send()
//     } catch (error) {
//         (error)
//     }
// })

//likes for project posts

// projectPostRouter.post('/:postId/like', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const user = await UserModel.findById(req.payload?._id)
//         if (!user) return next(createHttpError(404, `No user logged in`))
//         const userLikesPost = await PostModel.findOne({ $and: [{ _id: req.params.postId }, { likes: { $in: user } }] })
//         if (userLikesPost) {
//             const unlikedPost = await PostModel.findByIdAndUpdate(req.params.postId, { $pull: { likes: user._id } })
//             if (!unlikedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
//             res.send("You don't like this post anymore.")
//         } else {
//             const likedPost = await PostModel.findByIdAndUpdate(req.params.postId, { $push: { likes: user._id } })
//             if (!likedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
//             res.send('You like this post.')
//         }
//     } catch (error) {
//         next(error)
//     }
// })

//project posts comments