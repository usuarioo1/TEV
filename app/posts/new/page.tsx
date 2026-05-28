import Form from "next/form";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function NewPost() {
    // Obtener todos los usuarios para el selector
    const users = await prisma.user.findMany();

    async function createPost(formData: FormData) {
        "use server";

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const authorId = parseInt(formData.get("authorId") as string);

        await prisma.post.create({
            data: {
                title,
                content,
                authorId,
            },
        });

        revalidatePath("/posts");
        redirect("/posts");
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
            <Form action={createPost} className="space-y-6">
                <div>
                    <label htmlFor="authorId" className="block text-lg mb-2">
                        Author
                    </label>
                    <select
                        id="authorId"
                        name="authorId"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                    >
                        <option value="">Select an author</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="title" className="block text-lg mb-2">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Enter your post title"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label htmlFor="content" className="block text-lg mb-2">
                        Content
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        placeholder="Write your post content here..."
                        rows={6}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
                >
                    Create Post
                </button>
            </Form>
        </div>
    );
}
