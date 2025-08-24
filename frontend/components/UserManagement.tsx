import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Trash2, Edit, Plus, UserCheck, UserX } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useLanguage } from "./LanguageContext";

interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Treasurer" | "Viewer";
  status: "Active" | "Inactive";
  createdAt: string;
  lastLogin?: string;
}

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, "id" | "createdAt">) => void;
  onEditUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
}

export default function UserManagement({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
}: UserManagementProps) {
  const { t } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Viewer" as const,
    status: "Active" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.username ||
      !formData.email ||
      (!editingUser && !formData.password)
    ) {
      return;
    }

    if (editingUser) {
      onEditUser(editingUser.id, {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      });
      setEditingUser(null);
    } else {
      onAddUser({
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      });
      setIsAddDialogOpen(false);
    }

    setFormData({
      username: "",
      email: "",
      password: "",
      role: "Viewer",
      status: "Active",
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Treasurer":
        return "bg-blue-100 text-blue-800";
      case "Viewer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "Admin":
        return t("users.admin");
      case "Treasurer":
        return t("users.treasurer");
      case "Viewer":
        return t("users.viewer");
      default:
        return role;
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "Active" ? t("users.active") : t("users.inactive");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("users.title")}</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                {t("users.addUser")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("users.addNewUser")}</DialogTitle>
                <DialogDescription>
                  {t("users.createAccount")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">{t("users.username")}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("users.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t("users.role")}</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                      <SelectItem
                        className="hover:font-bold hover:bg-gray-100"
                        value="Admin"
                      >
                        {t("users.admin")}
                      </SelectItem>
                      <SelectItem
                        className="hover:font-bold hover:bg-gray-100"
                        value="Treasurer"
                      >
                        {t("users.treasurer")}
                      </SelectItem>
                      <SelectItem
                        className="hover:font-bold hover:bg-gray-100"
                        value="Viewer"
                      >
                        {t("users.viewer")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {t("users.addUser")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              <strong>{t("users.rolePermissions")}</strong>
              <br />
              <strong>{t("users.admin")}:</strong> {t("users.adminDesc")}
              <br />
              <strong>{t("users.treasurer")}:</strong>{" "}
              {t("users.treasurerDesc")}
              <br />
              <strong>{t("users.viewer")}:</strong> {t("users.viewerDesc")}
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.username")}</TableHead>
                <TableHead>{t("users.email")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("users.status")}</TableHead>
                <TableHead>{t("users.lastLogin")}</TableHead>
                <TableHead>{t("users.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin || t("users.never")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleUserStatus(user.id)}
                      >
                        {user.status === "Active" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
            <DialogDescription>{t("users.updateInfo")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-username">{t("users.username")}</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{t("users.email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-role">{t("users.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                  <SelectItem
                    className="hover:font-bold hover:bg-gray-100"
                    value="Admin"
                  >
                    {t("users.admin")}
                  </SelectItem>
                  <SelectItem
                    className="hover:font-bold hover:bg-gray-100"
                    value="Treasurer"
                  >
                    {t("users.treasurer")}
                  </SelectItem>
                  <SelectItem
                    className="hover:font-bold hover:bg-gray-100"
                    value="Viewer"
                  >
                    {t("users.viewer")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">{t("users.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                  <SelectItem
                    className="hover:font-bold hover:bg-gray-100"
                    value="Active"
                  >
                    {t("users.active")}
                  </SelectItem>
                  <SelectItem
                    className="hover:font-bold hover:bg-gray-100"
                    value="Inactive"
                  >
                    {t("users.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              {t("users.updateUser")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
