import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        // name
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true, 
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [60, "Name should not be more than 60 characters long"],
        },
        // email
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },
        // password
        password: {
            type: String,
            required: [
                function() {
                    return this.authProvider === "local";
                },
                "Password is required for email registration",
            ],
            select: false,
        },
        
        // Google OAuth Fields
        googleId: {
            type: String,
            default: null,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        emailVerified: {
            type: Boolean,
            default: true,
        },
        emailVerificationTokenHash: {
            type: String,
            select: false,
            index: true,
        },
        emailVerificationExpiresAt: {
            type: Date,
            select: false,
        },

        // User Role
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        // Profile image
        avatar:{
            type: String,
            default: "",

        },

        // phone number
        phone: {
            type: String,
            trim: true,
            default: "",
        },

        // account status
        isActive: {
            type: Boolean,
            default: true,
        },
        },
        {
            timestamps: true,
        }
    
);

userSchema.pre("save", async function () {
    // Password hasn't changed or isn't set (for google auth)
    if (!this.isModified("password") || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function(){
    const user = this.toObject();

    delete user.password;
    delete user.__v;
    delete user.emailVerificationTokenHash;
    delete user.emailVerificationExpiresAt;

    return user;
}



const User = mongoose.model('User', userSchema);
export default User;