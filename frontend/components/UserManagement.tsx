import { useEffect, useState } from "react";
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
  loading?: boolean;
  error?: string | null;
  currentUser?: any; // The current authenticated user
}

export default function UserManagement({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  loading = false,
  error = null,
  currentUser,
}: UserManagementProps) {
  const { t } = useLanguage();

  // NEW: fallback to persisted user during reload gap
  const [storedUser, setStoredUser] = useState<User | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth"); // { token, user }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) setStoredUser(parsed.user as User);
      }
    } catch {
      // ignore
    }
  }, []);

  const effectiveUser: User | null = (currentUser as User) ?? storedUser;

  // Use effectiveUser to preserve admin tools across refresh
  const isAdmin = effectiveUser?.role === "Admin";

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Viewer" as const,
    status: "Active" as const,
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const validateUsername = (username: string): string | null => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 50) return "Username must be less than 50 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Username can only contain letters, numbers, and underscores";
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email address";
    return null;
  };

  const validatePassword = (
    password: string,
    isRequired: boolean = true
  ): string | null => {
    if (!password && isRequired) return "Password is required";
    if (!password && !isRequired) return null;
    if (password && password.length < 8)
      return "Password must be at least 8 characters";
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one lowercase letter, one uppercase letter, and one number";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.username = usernameError;
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(formData.password, !editingUser);
    if (passwordError) errors.password = passwordError;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (editingUser) {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      onEditUser(editingUser.id, updateData);
      setEditingUser(null);
    } else {
      onAddUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
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
    setValidationErrors({});
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
    setValidationErrors({});
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
          {isAdmin && (
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
                        handleInputChange("username", e.target.value)
                      }
                      required
                      className={
                        validationErrors.username ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.username}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      3-50 characters, letters, numbers, and underscores only
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email">{t("users.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">{t("login.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      className={
                        validationErrors.password ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.password}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Min 8 characters with uppercase, lowercase, and number
                    </p>
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
          )}
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

          {error && (
            <Alert className="mb-4 border-red-300 bg-red-50">
              <AlertDescription className="text-red-700">
                <strong>Error loading users:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No users found.</p>
              <p className="text-sm text-gray-500">
                Add your first user using the "Add User" button above.
              </p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
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
                {users.map((user) => (
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
                        {isAdmin ? (
                          <>
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
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            View Only
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
                className={validationErrors.username ? "border-red-500" : ""}
              />
              {validationErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.username}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-email">{t("users.email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-password">
                {t("login.password")} (optional)
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Leave blank to keep current password"
                className={validationErrors.password ? "border-red-500" : ""}
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.password}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Leave blank to keep current password. If changing: min 8
                characters with uppercase, lowercase, and number
              </p>
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
