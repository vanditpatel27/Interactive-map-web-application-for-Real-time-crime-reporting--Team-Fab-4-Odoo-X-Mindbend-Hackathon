"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { CommentWithAuthorProps } from "@/types"
import { Send } from "lucide-react"

interface CommentsSectionProps {
    comments: CommentWithAuthorProps[]
    onCommentSubmit: (content: string) => void
}

export function CommentsSection({ comments, onCommentSubmit }: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("")
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return
        onCommentSubmit(newComment)
        setNewComment("")
    }
    
    return (
        <Card className="w-full max-w-3xl mx-auto bg-background/50 backdrop-blur">
            <CardHeader className="border-b">
                <CardTitle className="text-xl flex items-center">
                    <span className="mr-2">Comments</span>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {comments.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Textarea 
                            placeholder="Add a comment..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-24 sm:min-h-0 flex-1 resize-none"
                        />
                        <Button 
                            type="submit" 
                            className="sm:self-end flex items-center"
                            disabled={!newComment.trim()}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            <span>Post</span>
                        </Button>
                    </div>
                </form>
                
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div 
                                key={comment._id} 
                                className="flex space-x-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                            >
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                    <AvatarImage src={`https://avatar.vercel.sh/${comment.author}`} alt={comment.authorName} />
                                    <AvatarFallback>{comment.authorName?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                        <span className="font-medium text-sm sm:text-base">{comment.authorName}</span>
                                        <span className="text-xs sm:text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm sm:text-base break-words whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}