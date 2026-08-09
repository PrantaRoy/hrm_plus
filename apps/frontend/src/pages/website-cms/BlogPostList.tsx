import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlogPostDto } from "@hrm-plus/shared";
import { Badge, BadgeColor, Button, EmptyState, PageHeader, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { deleteBlogPost, listBlogPosts, publishBlogPost, unpublishBlogPost } from "../../api/blogPosts";

const statusColor: Record<BlogPostDto["status"], BadgeColor> = {
  DRAFT: "slate",
  PUBLISHED: "green",
};

export default function BlogPostList() {
  const [posts, setPosts] = useState<BlogPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listBlogPosts()
      .then(setPosts)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load blog posts"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handlePublish(id: number) {
    setError(null);
    try {
      await publishBlogPost(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to publish post");
    }
  }

  async function handleUnpublish(id: number) {
    setError(null);
    try {
      await unpublishBlogPost(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to unpublish post");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this blog post?")) return;
    setError(null);
    try {
      await deleteBlogPost(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete blog post");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blog"
        description="Manage articles shown in the public website's Blog section."
        actions={
          <Link
            to="/website-cms/blog/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New Post
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {!loading && posts.length === 0 ? (
        <EmptyState title="No blog posts yet" description="Write your first article." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Author</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link to={`/website-cms/blog/${post.id}/edit`} className="font-medium text-brand-600 hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{post.authorName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge color={statusColor[post.status]}>{post.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {post.status === "DRAFT" ? (
                      <Button size="sm" onClick={() => handlePublish(post.id)} className="mr-2">
                        Publish
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => handleUnpublish(post.id)} className="mr-2">
                        Unpublish
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(post.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
