import { MessageSquare, User } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  references: Array<{ type: string; path: string }>;
}

interface CommentsPaneProps {
  comments: Comment[];
  onReferenceClick: (reference: { type: string; path: string }) => void;
}

export default function CommentsPane({ comments, onReferenceClick }: CommentsPaneProps) {
  const parseCommentText = (comment: Comment) => {
    const parts: Array<{ type: "text" | "reference"; content: string; reference?: { type: string; path: string } }> = [];
    let currentText = comment.text;
    
    // Find all @ mentions
    const mentions = comment.text.match(/@[\w\s.[\]]+/g) || [];
    mentions.forEach((mention, index) => {
      const [before, ...rest] = currentText.split(mention);
      if (before) {
        parts.push({ type: "text", content: before });
      }
      parts.push({
        type: "reference",
        content: mention,
        reference: comment.references[index],
      });
      currentText = rest.join(mention);
    });
    
    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }
    
    return parts;
  };

  return (
    <div className="p-4 border-b">
      <h3 className="text-sm mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Comments ({comments.length})
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm border-b pb-3 last:border-b-0">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{comment.author}</span>
                  <span className="text-xs text-gray-500">{comment.timestamp}</span>
                </div>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                  {parseCommentText(comment).map((part, idx) => {
                    if (part.type === "reference" && part.reference) {
                      return (
                        <span
                          key={idx}
                          onClick={() => onReferenceClick(part.reference!)}
                          className="inline-flex items-center px-1 py-0.5 rounded cursor-pointer hover:bg-blue-50 text-blue-600 font-medium"
                          title={`Click to highlight ${part.reference.path}`}
                        >
                          {part.content}
                        </span>
                      );
                    }
                    return <span key={idx}>{part.content}</span>;
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-3 px-3 py-2 border border-dashed rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
        <MessageSquare className="w-3 h-3" />
        Add Comment
      </button>
    </div>
  );
}
