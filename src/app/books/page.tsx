"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Book, FileText, Loader2, AlertCircle, TrendingUp, Eye, Star, Bookmark, DollarSign } from "lucide-react";

type ContentType = "books" | "stories" | "blogs";

interface ContentEngagement {
  content_id: string;
  title: string;
  author_name: string;
  status: string;
  views_count: number;
  sales_count: number;
  bookmarks_count: number;
  reviews_count: number;
  avg_rating: number;
  engagement_score: number;
}

export default function ContentDashboard() {
  const [activeTab, setActiveTab] = useState<ContentType>("books");
  const [contentList, setContentList] = useState<ContentEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase.rpc("get_content_engagement", {
          p_content_type: activeTab,
        });

        if (error) {
          if (error.message.includes("function get_content_engagement() does not exist")) {
             throw new Error("The 'get_content_engagement' database function is missing. Please run the supabase_content_schema.sql script.");
          }
          throw error;
        }

        setContentList(data || []);
      } catch (err: any) {
        console.error("Error fetching content engagement:", err);
        setErrorMsg(err.message || "Failed to load content data.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Content Hub</h1>
        <p className="text-sm text-zinc-500 mt-1">Deep engagement analytics for books, stories, and blogs.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "books"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            <Book className="h-4 w-4" />
            Books
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "stories"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Stories
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "blogs"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            Blogs
          </button>
        </nav>
      </div>

      {/* Content Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        
        {/* Table Header / Action Area */}
        <div className="border-b border-zinc-200 p-6 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 capitalize">{activeTab} Performance</h2>
            <p className="text-sm text-zinc-500 mt-1 max-w-xl">
              Ranked by Engagement Score. The score is calculated based on Views (1x), Bookmarks (5x), Reviews (10x), and Sales (20x).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
            </div>
          ) : contentList.length > 0 ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title & Author</th>
                  <th className="px-6 py-4 font-semibold text-center">Score</th>
                  <th className="px-6 py-4 font-semibold text-center">Views</th>
                  {activeTab !== "blogs" && <th className="px-6 py-4 font-semibold text-center">Sales</th>}
                  <th className="px-6 py-4 font-semibold text-center">Bookmarks</th>
                  <th className="px-6 py-4 font-semibold text-center">Reviews</th>
                  <th className="px-6 py-4 font-semibold text-center">Avg Rating</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {contentList.map((item, idx) => (
                  <tr key={item.content_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">{item.title}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">by {item.author_name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {Number(item.engagement_score).toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-600">
                      <div className="flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        {item.views_count}
                      </div>
                    </td>
                    {activeTab !== "blogs" && (
                      <td className="px-6 py-4 text-center text-zinc-600">
                        <div className="flex items-center justify-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          {item.sales_count}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center text-zinc-600">
                      <div className="flex items-center justify-center gap-1.5">
                        <Bookmark className="w-4 h-4 text-zinc-400" />
                        {item.bookmarks_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-600">
                      <div className="flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        {item.reviews_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className={`w-4 h-4 ${item.avg_rating > 0 ? "text-yellow-400 fill-yellow-400" : "text-zinc-300"}`} />
                        <span className="font-medium text-zinc-700">{Number(item.avg_rating).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="rounded-full bg-zinc-100 p-4 text-zinc-400 mb-4">
                {activeTab === "books" && <Book className="h-8 w-8" />}
                {activeTab === "stories" && <BookOpen className="h-8 w-8" />}
                {activeTab === "blogs" && <FileText className="h-8 w-8" />}
              </div>
              <h3 className="text-base font-semibold text-zinc-900">No {activeTab} found</h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                There are no {activeTab} in the database yet, or the RPC function needs to be executed in Supabase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
