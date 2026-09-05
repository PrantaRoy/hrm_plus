import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { SaasBlogPostDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Spinner,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import {
  deleteBlogPost,
  listBlogPosts,
  publishBlogPost,
  unpublishBlogPost,
} from "../../../api/blog";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export default function BlogPostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SaasBlogPostDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listBlogPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }

  useEffect(refresh, []);

  async function togglePublish(post: SaasBlogPostDto) {
    if (post.status === "PUBLISHED") await unpublishBlogPost(post.id);
    else await publishBlogPost(post.id);
    refresh();
  }

  async function remove(post: SaasBlogPostDto) {
    setError(null);
    try {
      await deleteBlogPost(post.id);
      refresh();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Failed to delete"
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog"
        description="Posts shown on the public marketing site."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/admin/blog/new")}>
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {posts === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Published</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium text-slate-900">
                  <Link to={`/admin/blog/${post.id}`} className="hover:text-brand-700">
                    {post.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge color={post.status === "PUBLISHED" ? "green" : "slate"}>
                    {post.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(post.publishedAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mr-2"
                    onClick={() => togglePublish(post)}
                  >
                    {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mr-2"
                    onClick={() => navigate(`/admin/blog/${post.id}`)}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(post)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="No posts yet" description="Write your first blog post." />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
