export interface IUser {
    name: string,
    email: string,
    phoneNumber?: string,
    password: string,
    isVerified: boolean,
    otp: string;
    otpExpiresAt: Date;
    role: string,
    batchNo:String,
    latitude:String,
    longitude:String,
}

export interface IUserInfo {
    userId: string;
    email: string;
    avatar?: string;
    bio?: string;
    address?: string;
}

export interface ICrimeReport {
    _id: string;
    title: string;
    description: string;
    location_name: string,
    location: {
        type: string,
        coordinates: number[],
    },
    images: string[],
    videos: string[],
    videoDescription?: string,
    reportedBy: string,
    upvotes: number,
    downvotes: number
    comments: string[],
    verified: boolean,
    verificationScore?: number,
    status: 'verified' | 'investigating' | 'resolved' | 'not verified' | 'fake',
    crimeTime: Date,
    isAnonymous?: boolean,
    suspicionLevel: number,
    isBanned: boolean,
    updatedAt: Date,
    createdAt: Date
    author?: {
        name: string;
        avatar: string;
    }
    givenTo?: string; 
}

export interface IComment {
    _id: string;
    crimeReportId: string;
    author: string;
    content: string;
    replyOf: string;
    createdAt: Date;
    updatedAt: Date;
}


export interface IVote {
    reportId: string;
    userId: string;
    vote: 'upvote' | 'downvote';
    createdAt: Date;
    updatedAt: Date;
}

export type Address = {
    name?: string;
    location: { lat: number, lng: number };
}

export interface IEmergencyContact {
    name: string,
    address: string,
    contact_number: string,
    location: {
        type: string,
        coordinates: number[],
    },
    type: string,
    status: 'updated' | 'outdated',
    createdAt: Date,
}

export interface INotificationSubscription {
    userId: String,
    subscription: Object,
    createdAt: Date,   
}

export interface CommentWithAuthorProps extends IComment {
    authorName: string
}

export interface IApproveAnonymousReport {
    crimeReportId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
