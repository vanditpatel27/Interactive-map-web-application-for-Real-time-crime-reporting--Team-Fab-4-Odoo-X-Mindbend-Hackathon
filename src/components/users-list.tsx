"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ban, 
  Trash2, 
  UserCheck, 
  Shield, 
  User, 
  Search, 
  ListFilter, 
  Loader2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type User = {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: "user" | "admin";
  phoneNumber?: string;
};

function UsersList() {
  const [users, setUsers] = useState<any>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterVerification, setFilterVerification] = useState<"all" | "verified" | "unverified">("all");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        console.log(data.users);
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (err) {
        setError("Failed to load users");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...users];
    
    // Apply search
    if (searchTerm) {
      result = result.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phoneNumber && user.phoneNumber.includes(searchTerm)) ||
        (user.batchNo && user.batchNo.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    
    // Apply role filter
    if (filterRole !== "all") {
      result = result.filter(user => user.role === filterRole);
    }
    
    // Apply verification filter
    if (filterVerification !== "all") {
      result = result.filter(user => 
        filterVerification === "verified" ? user.isVerified : !user.isVerified
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, filterRole, filterVerification]);

  const toggleUserVerification = async (userId: string) => {
    // Optimistic UI update
    setUsers((prev:any) => 
      prev.map((user:any) => 
        user._id === userId 
          ? {...user, isVerified: !user.isVerified} 
          : user
      )
    );
    
    try {
      // Implement the API call to toggle user verification
      // const response = await fetch(`/api/admin/users/${userId}/verify`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ isVerified: !users.find(u => u._id === userId)?.isVerified })
      // });
      // if (!response.ok) throw new Error('Failed to update user');
      console.log(`Toggle verification for user ${userId}`);
    } catch (err) {
      // Revert on error
      setUsers((prev:any) => 
        prev.map((user:any) => 
          user._id === userId 
            ? {...user, isVerified: !user.isVerified} 
            : user
        )
      );
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    // Optimistic UI update
    setUsers((prev:any) => prev.filter((user:any) => user._id !== userId));
    
    try {
      // Implement the API call to delete the user
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: 'DELETE'
      // });
      // if (!response.ok) throw new Error('Failed to delete user');
      console.log(`Delete user ${userId}`);
    } catch (err) {
      // Revert on error
      const deletedUser = users.find((user:any) => user._id === userId);
      if (deletedUser) {
        setUsers((prev:any) => [...prev, deletedUser]);
      }
      console.error(err);
    }
  };

  // Mobile view card component for each user
  const UserCard = ({ user }: { user: User }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{user.name}</CardTitle>
            <CardDescription className="text-sm">{user.email}</CardDescription>
          </div>
          <Badge variant={user.role === "admin" ? "default" : "outline"}>
            {user.role === "admin" ? (
              <span className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </span>
            ) : (
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                User
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge 
              variant={user.isVerified ? "default" : "destructive"} 
              className="ml-2"
            >
              {user.isVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="ml-2">{user.phoneNumber || "N/A"}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleUserVerification(user._id)}
          >
            {user.isVerified ? (
              <>
                <Ban className="h-4 w-4 mr-1" />
                Unverify
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-1" />
                Verify
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:border-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {user.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end space-x-2 mt-4">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteUser(user._id)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Loading users...</span>
    </div>
  );
  
  if (error) return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="pt-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
        <CardDescription>
          Manage user accounts, verify users, and control access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterRole("all")}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("admin")}>
                  Admins Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("user")}>
                  Users Only
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterVerification("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterVerification("verified")}>
                  Verified Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterVerification("unverified")}>
                  Unverified Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching your criteria
          </div>
        ) : (
          <>
            {/* Desktop view - Table */}
            <div className="hidden md:block">
              <ScrollArea className="h-[calc(100vh-16rem)] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user:any) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                        {user.role === "admin" ? (
  <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
    <Shield className="h-3 w-3 mr-1" />
    Admin
  </Badge>
) : user.role === "police" ? (
  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
    <Shield className="h-3 w-3 mr-1" />
    Police
  </Badge>
) : (
  <Badge variant="outline">
    <User className="h-3 w-3 mr-1" />
    User
  </Badge>
)}

                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isVerified ? "default" : "destructive"}
                            className={user.isVerified 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                        <TableCell>{user.batchNo || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserVerification(user._id)}
                            className="mr-2"
                          >
                            {user.isVerified  ? (
                              <>
                                <Ban className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Unverify</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Verify</span>
                              </>
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:border-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete {user.name}? This action
                                  cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <Button variant="outline">
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteUser(user._id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Mobile view - Cards */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          </>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
}

export default UsersList;