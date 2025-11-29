import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

class Config {
    static ACTIVITY_STATUS = "Yui Mizuno aqui mano";

    static DATA_DIR = "data";
    static AUDIO_DIR = "recordings";

    static setupDirectories() {
        if (!fs.existsSync(this.DATA_DIR)) {
            fs.mkdirSync(this.DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(this.AUDIO_DIR)) {
            fs.mkdirSync(this.AUDIO_DIR, { recursive: true });
        }
    }
}

export default Config;
