class User {
    constructor(id, name, email, password, points, profilePicture, coverPhoto, bio) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.points = points;
        this.profilePicture = profilePicture;
        this.coverPhoto = coverPhoto;
        this.bio = bio;
    }
}

export default User;
